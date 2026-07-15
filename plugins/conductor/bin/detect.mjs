#!/usr/bin/env node
// conductor: read-only project detection. Emits a facts JSON to stdout that the
// `init` skill presents and confirms. Never writes anything. JS/TS-first; records
// non-JS stacks as a warning rather than pretending to understand them.

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { execSync } from 'node:child_process'

const dir = process.argv.includes('--dir')
  ? process.argv[process.argv.indexOf('--dir') + 1]
  : process.cwd()

const has = p => existsSync(join(dir, p))
const readJson = p => {
  try {
    return JSON.parse(readFileSync(join(dir, p), 'utf8'))
  } catch {
    return null
  }
}
const git = cmd => {
  try {
    return execSync(`git ${cmd}`, { cwd: dir, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
  } catch {
    return null
  }
}

const pkg = readJson('package.json') ?? {}
const scripts = pkg.scripts ?? {}
const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) }

const confidence = {}
const needsConfirm = []
const warnings = []
const mark = (key, level) => {
  confidence[key] = level
  if (level !== 'high') needsConfirm.push(key)
}

// package manager
let packageManager = null
if (has('pnpm-lock.yaml')) packageManager = 'pnpm'
else if (has('bun.lockb') || has('bun.lock')) packageManager = 'bun'
else if (has('yarn.lock')) packageManager = 'yarn'
else if (has('package-lock.json')) packageManager = 'npm'
mark('packageManager', packageManager ? 'high' : 'low')
if (!packageManager && pkg.name) packageManager = 'npm'

// task runner
let taskRunner = 'none'
if (has('turbo.json')) taskRunner = 'turbo'
else if (has('nx.json')) taskRunner = 'nx'
else if (has('Makefile') || has('makefile')) taskRunner = 'make'
mark('taskRunner', taskRunner === 'none' ? 'medium' : 'high')

// monorepo
const monorepo = Boolean(pkg.workspaces) || has('pnpm-workspace.yaml') || taskRunner !== 'none'

// stack
const stack = []
if (has('tsconfig.json')) stack.push('typescript')
if (pkg.name || has('jsconfig.json')) stack.push('javascript')
for (const [file, name] of [
  ['Cargo.toml', 'rust'],
  ['go.mod', 'go'],
  ['pyproject.toml', 'python'],
  ['requirements.txt', 'python'],
  ['pom.xml', 'java'],
  ['Gemfile', 'ruby'],
]) {
  if (has(file)) {
    warnings.push(`Non-JS stack file present (${file} → ${name}): v1 detection is JS/TS-first, so gates/conventions for it need to be entered by hand.`)
  }
}

// gate commands from package.json scripts
const run = s => (packageManager ? `${packageManager} run ${s}` : `npm run ${s}`)
const pick = (...names) => names.find(n => scripts[n] != null)
const gates = {}
const gateGuess = {
  lint: pick('lint', 'lint:check', 'oxlint', 'eslint'),
  format: pick('format', 'format:check', 'fmt', 'prettier:check'),
  formatWrite: pick('format:write', 'format:fix', 'fmt:write', 'prettier:write'),
  typecheck: pick('typecheck', 'type-check', 'tsc', 'check-types'),
  build: pick('build'),
  test: pick('test'),
}
for (const [gate, script] of Object.entries(gateGuess)) {
  gates[gate] = script ? run(script) : ''
  mark(`gates.${gate}`, script ? (script === gate || script === gate.replace('Write', ':write') ? 'high' : 'medium') : 'low')
}

// linter / formatter tooling (informational)
const tools = {
  linter: deps.oxlint ? 'oxlint' : deps.eslint ? 'eslint' : deps['@biomejs/biome'] ? 'biome' : null,
  formatter: has('.oxfmtrc.json') || has('.oxfmtrc')
    ? 'oxfmt'
    : deps.prettier
      ? 'prettier'
      : deps['@biomejs/biome']
        ? 'biome'
        : null,
}

// trunk branch
let trunk =
  git('symbolic-ref --short refs/remotes/origin/HEAD')?.replace(/^origin\//, '') ??
  git('config init.defaultBranch')
if (!trunk) {
  const branches = git('branch --format=%(refname:short)')?.split('\n') ?? []
  trunk = ['main', 'dev', 'master', 'trunk'].find(b => branches.includes(b)) ?? null
}
mark('trunk', trunk ? 'medium' : 'low')

// protected paths
const protectedSet = new Set(['**/.env*'])
try {
  const gi = readFileSync(join(dir, '.gitignore'), 'utf8').split('\n')
  for (const raw of gi) {
    const line = raw.trim()
    if (!line || line.startsWith('#') || line.startsWith('!')) continue
    if (/\.env|\.local|secret|credential|\.key$|\.pem$/i.test(line)) protectedSet.add(line)
  }
} catch {}
const protectedPaths = [...protectedSet]

// codegen
const codegenSignals = []
for (const f of ['codegen.yml', 'codegen.ts', 'codegen.yaml', '.graphqlrc', '.graphqlrc.yml', '.graphqlrc.ts', 'graphql.config.ts', 'graphql.config.js']) {
  if (has(f)) codegenSignals.push(f)
}
const codegenScript = pick('codegen', 'generate:schema', 'generate:types', 'generate')
if (codegenScript) codegenSignals.push(`script:${codegenScript}`)
const codegen = {
  needed: codegenSignals.length > 0,
  command: codegenScript ? run(codegenScript) : '',
  prerequisite: '',
  signals: codegenSignals,
}
if (codegen.needed) needsConfirm.push('codegen.prerequisite')

// visual QA
const sbScript = pick('storybook', 'storybook:dev')
const devScript = pick('dev', 'start')
const hasStorybookDep = Object.keys(deps).some(d => d === 'storybook' || d.startsWith('@storybook/'))
const storybook = has('.storybook') || Boolean(sbScript) || hasStorybookDep
const visualQA = {
  tool: storybook ? 'playwright' : 'none',
  target: storybook ? 'storybook' : devScript ? 'devserver' : 'none',
  startCommand: sbScript ? run(sbScript) : devScript ? run(devScript) : '',
}
mark('visualQA.target', has('.storybook') && sbScript ? 'high' : storybook ? 'medium' : 'low')

const facts = {
  cwd: dir,
  detected: {
    packageManager,
    taskRunner,
    monorepo,
    stack,
    trunk,
    tools,
    gates,
    protected: protectedPaths,
    codegen,
    visualQA,
  },
  confidence,
  needsConfirm: [...new Set(needsConfirm)],
  warnings,
}

process.stdout.write(JSON.stringify(facts, null, 2) + '\n')
