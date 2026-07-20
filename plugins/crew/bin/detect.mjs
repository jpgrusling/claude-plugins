#!/usr/bin/env node
// crew: read-only project detection. Emits a facts JSON to stdout that the
// `init` skill presents and confirms. Never writes anything. JS/TS-first, with a
// best-effort polyglot pass (Makefile/justfile targets + Rust/Go/Python
// conventions) for gate commands — all flagged for confirmation.

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
const nonJsLangs = new Set()
for (const [file, name] of [
  ['Cargo.toml', 'rust'],
  ['go.mod', 'go'],
  ['pyproject.toml', 'python'],
  ['requirements.txt', 'python'],
  ['pom.xml', 'java'],
  ['Gemfile', 'ruby'],
]) {
  if (has(file)) nonJsLangs.add(name)
}
for (const l of nonJsLangs) if (!stack.includes(l)) stack.push(l)

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

// polyglot gate fill: for stacks package.json scripts don't cover, guess from a
// Makefile/justfile's targets first, then language conventions. Best-effort and
// always flagged for confirmation — a JS script, if present, wins.
const makeRunner =
  has('Makefile') || has('makefile') ? 'make' : has('justfile') || has('.justfile') ? 'just' : null
const targets = new Set()
if (makeRunner) {
  for (const f of ['Makefile', 'makefile', 'justfile', '.justfile']) {
    if (!has(f)) continue
    try {
      for (const line of readFileSync(join(dir, f), 'utf8').split('\n')) {
        if (line.startsWith('\t') || line.startsWith('.')) continue
        const m = line.match(/^([a-zA-Z0-9_-]+)[^=:]*:(?!=)/)
        if (m) targets.add(m[1])
      }
    } catch {}
  }
}
const targetFor = (...names) => names.find(n => targets.has(n))

const pyText = ['pyproject.toml', 'requirements.txt', 'setup.cfg', 'tox.ini']
  .map(f => {
    try {
      return has(f) ? readFileSync(join(dir, f), 'utf8') : ''
    } catch {
      return ''
    }
  })
  .join('\n')
const pyHas = t => pyText.includes(t)

const langGates = {}
if (nonJsLangs.has('rust'))
  Object.assign(langGates, {
    lint: 'cargo clippy',
    format: 'cargo fmt --check',
    formatWrite: 'cargo fmt',
    typecheck: 'cargo check',
    build: 'cargo build',
    test: 'cargo test',
  })
if (nonJsLangs.has('go'))
  Object.assign(langGates, {
    lint: 'go vet ./...',
    format: 'gofmt -l .',
    formatWrite: 'gofmt -w .',
    build: 'go build ./...',
    test: 'go test ./...',
  })
if (nonJsLangs.has('python'))
  Object.assign(langGates, {
    lint: pyHas('ruff') ? 'ruff check .' : '',
    format: pyHas('ruff') ? 'ruff format --check .' : pyHas('black') ? 'black --check .' : '',
    formatWrite: pyHas('ruff') ? 'ruff format .' : pyHas('black') ? 'black .' : '',
    typecheck: pyHas('mypy') ? 'mypy .' : pyHas('pyright') ? 'pyright' : '',
    test: pyHas('pytest') ? 'pytest' : '',
    build: pyHas('build') ? 'python -m build' : '',
  })

const gateTargets = {
  lint: ['lint'],
  format: ['format', 'fmt', 'format-check', 'fmt-check'],
  formatWrite: ['format-write', 'fmt-write', 'format-fix'],
  typecheck: ['typecheck', 'type-check', 'check'],
  build: ['build'],
  test: ['test'],
}
const langConf = nonJsLangs.has('rust') || nonJsLangs.has('go') ? 'medium' : 'low'
for (const gate of Object.keys(gateGuess)) {
  if (gates[gate]) continue // a JS script wins
  const tgt = targetFor(...gateTargets[gate])
  if (tgt) {
    gates[gate] = `${makeRunner} ${tgt}`
    mark(`gates.${gate}`, 'medium')
  } else if (langGates[gate]) {
    gates[gate] = langGates[gate]
    mark(`gates.${gate}`, langConf)
  }
}

if (nonJsLangs.size) {
  warnings.push(
    `Non-JS stack detected (${[...nonJsLangs].join(', ')}): gate commands are inferred best-effort from ${makeRunner ? `the ${makeRunner}file and ` : ''}language conventions — confirm them before relying on them.`,
  )
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
