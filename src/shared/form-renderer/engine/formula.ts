// GENERATED from apex-form-renderer/src — do not edit here. Edit there, then run `npm run sync`.
/**
 * The formula language for computed values — the browser's copy of the backend's
 * `packages/modules/forms/engine/formula.ts` (forms/steps-layout-computed.md §4). The server runs
 * the same formulas; both sides must agree on every result, so this file follows the backend's line
 * for line, and `fixtures/formula-cases.json` (copied from the backend) is the contract both run:
 * `npm run test:formula`.
 *
 * A hand-written tokenizer and precedence-climbing parser, never `eval` or `Function`. Values are
 * numbers or `null` (unknown). Booleans are 1 / 0. Any `null` operand makes arithmetic,
 * comparisons and functions `null`; `&&`, `||` and `if` read `null` as false. A result that is not
 * finite (division by zero, overflow) is `null`.
 */
export const FORMULA_MAX_LENGTH = 500
export const FORMULA_MAX_DEPTH = 32

export type FormulaRef = { kind: 'answers' | 'facts' | 'computed'; key: string }

type BinaryOp = '+' | '-' | '*' | '/' | '%' | '^' | '<' | '<=' | '>' | '>=' | '==' | '!=' | '&&' | '||'
type FunctionName = 'round' | 'floor' | 'ceil' | 'abs' | 'min' | 'max' | 'if'

export type FormulaAst =
  | { t: 'num'; value: number }
  | { t: 'ref'; ref: FormulaRef }
  | { t: 'neg'; arg: FormulaAst }
  | { t: 'bin'; op: BinaryOp; left: FormulaAst; right: FormulaAst }
  | { t: 'call'; fn: FunctionName; args: FormulaAst[] }

export type ParseResult =
  | { ok: true; ast: FormulaAst; refs: FormulaRef[] }
  | { ok: false; error: string; position: number }

export interface FormulaScope {
  answer(key: string): number | null
  fact(key: string): number | null
  computed(key: string): number | null
}

/** [min, max] argument counts; max `Infinity` = variadic. */
const FUNCTIONS: Record<FunctionName, [number, number]> = {
  round: [1, 2],
  floor: [1, 1],
  ceil: [1, 1],
  abs: [1, 1],
  min: [1, Infinity],
  max: [1, Infinity],
  if: [3, 3],
}

const NAMESPACES = new Set(['answers', 'facts', 'computed'])
const KEY = /^[a-zA-Z][a-zA-Z0-9_]*$/
// `answers.constructor` must never reach a property lookup on a plain object.
const RESERVED = new Set(Object.getOwnPropertyNames(Object.prototype))

type Token =
  | { k: 'num'; value: number; pos: number }
  | { k: 'ref'; ref: FormulaRef; pos: number }
  | { k: 'fn'; name: FunctionName; pos: number }
  | { k: 'op'; op: string; pos: number }
  | { k: 'end'; pos: number }

class FormulaError extends Error {
  constructor(message: string, readonly position: number) {
    super(message)
  }
}

const TWO_CHAR_OPS = ['<=', '>=', '==', '!=', '&&', '||']
const ONE_CHAR_OPS = '+-*/%^<>(),'

function tokenize(src: string): Token[] {
  const out: Token[] = []
  let i = 0
  while (i < src.length) {
    const ch = src[i]!
    if (/\s/.test(ch)) {
      i++
      continue
    }
    const start = i
    if (/[0-9.]/.test(ch)) {
      const m = /^(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/.exec(src.slice(i))
      if (!m) throw new FormulaError(`Unexpected "${ch}" at ${start}`, start)
      out.push({ k: 'num', value: Number(m[0]), pos: start })
      i += m[0].length
      continue
    }
    if (/[a-zA-Z_]/.test(ch)) {
      const name = /^[a-zA-Z_][a-zA-Z0-9_]*/.exec(src.slice(i))![0]
      i += name.length
      if (src[i] === '.') {
        if (!NAMESPACES.has(name)) throw new FormulaError(`Unknown reference "${name}" at ${start}; use answers., facts. or computed.`, start)
        const key = /^[a-zA-Z0-9_]*/.exec(src.slice(i + 1))![0]
        if (!KEY.test(key) || RESERVED.has(key)) {
          throw new FormulaError(`"${name}.${key}" is not a valid reference (at ${start})`, start)
        }
        i += 1 + key.length
        out.push({ k: 'ref', ref: { kind: name as FormulaRef['kind'], key }, pos: start })
        continue
      }
      if (Object.prototype.hasOwnProperty.call(FUNCTIONS, name)) {
        out.push({ k: 'fn', name: name as FunctionName, pos: start })
        continue
      }
      throw new FormulaError(`Unknown name "${name}" at ${start}`, start)
    }
    const two = src.slice(i, i + 2)
    if (TWO_CHAR_OPS.includes(two)) {
      out.push({ k: 'op', op: two, pos: start })
      i += 2
      continue
    }
    if (ONE_CHAR_OPS.includes(ch)) {
      out.push({ k: 'op', op: ch, pos: start })
      i++
      continue
    }
    throw new FormulaError(`Unexpected "${ch}" at ${start}`, start)
  }
  out.push({ k: 'end', pos: src.length })
  return out
}

class Parser {
  private i = 0
  private depth = 0
  constructor(private readonly tokens: Token[]) {}

  parse(): FormulaAst {
    const ast = this.or()
    const t = this.peek()
    if (t.k !== 'end') this.fail(t)
    return ast
  }

  private peek(): Token {
    return this.tokens[this.i]!
  }
  private isOp(...ops: string[]): string | null {
    const t = this.peek()
    return t.k === 'op' && ops.includes(t.op) ? t.op : null
  }
  private expect(op: string): void {
    if (!this.isOp(op)) {
      const t = this.peek()
      throw new FormulaError(`Expected "${op}" at ${t.pos}`, t.pos)
    }
    this.i++
  }
  private fail(t: Token): never {
    if (t.k === 'end') throw new FormulaError(`Formula ends too early (at ${t.pos})`, t.pos)
    const text = t.k === 'op' ? t.op : t.k === 'num' ? String(t.value) : t.k === 'fn' ? t.name : `${t.ref.kind}.${t.ref.key}`
    throw new FormulaError(`Unexpected "${text}" at ${t.pos}`, t.pos)
  }
  private enter(pos: number): void {
    if (++this.depth > FORMULA_MAX_DEPTH) {
      throw new FormulaError(`Formula is nested more than ${FORMULA_MAX_DEPTH} levels deep (at ${pos})`, pos)
    }
  }

  private or(): FormulaAst {
    let left = this.and()
    while (this.isOp('||')) {
      this.i++
      left = { t: 'bin', op: '||', left, right: this.and() }
    }
    return left
  }
  private and(): FormulaAst {
    let left = this.cmp()
    while (this.isOp('&&')) {
      this.i++
      left = { t: 'bin', op: '&&', left, right: this.cmp() }
    }
    return left
  }
  private cmp(): FormulaAst {
    const left = this.add()
    const op = this.isOp('<', '<=', '>', '>=', '==', '!=')
    if (!op) return left
    this.i++
    return { t: 'bin', op: op as BinaryOp, left, right: this.add() }
  }
  private add(): FormulaAst {
    let left = this.mul()
    for (let op = this.isOp('+', '-'); op; op = this.isOp('+', '-')) {
      this.i++
      left = { t: 'bin', op: op as BinaryOp, left, right: this.mul() }
    }
    return left
  }
  private mul(): FormulaAst {
    let left = this.unary()
    for (let op = this.isOp('*', '/', '%'); op; op = this.isOp('*', '/', '%')) {
      this.i++
      left = { t: 'bin', op: op as BinaryOp, left, right: this.unary() }
    }
    return left
  }
  /** Unary minus binds looser than `^`, so `-2 ^ 2` is `-(2 ^ 2)`. */
  private unary(): FormulaAst {
    if (this.isOp('-')) {
      this.enter(this.peek().pos)
      this.i++
      const arg = this.unary()
      this.depth--
      return { t: 'neg', arg }
    }
    return this.pow()
  }
  /** `^` is right to left: its right side is a whole unary expression. */
  private pow(): FormulaAst {
    const base = this.primary()
    if (!this.isOp('^')) return base
    this.i++
    return { t: 'bin', op: '^', left: base, right: this.unary() }
  }
  private primary(): FormulaAst {
    const t = this.peek()
    if (t.k === 'num') {
      this.i++
      return { t: 'num', value: t.value }
    }
    if (t.k === 'ref') {
      this.i++
      return { t: 'ref', ref: t.ref }
    }
    if (t.k === 'fn') {
      this.i++
      this.enter(t.pos)
      this.expect('(')
      const args: FormulaAst[] = []
      if (!this.isOp(')')) {
        args.push(this.or())
        while (this.isOp(',')) {
          this.i++
          args.push(this.or())
        }
      }
      this.expect(')')
      this.depth--
      const [min, max] = FUNCTIONS[t.name]
      if (args.length < min || args.length > max) {
        const want = min === max ? `${min}` : max === Infinity ? `at least ${min}` : `${min} to ${max}`
        throw new FormulaError(`${t.name}() takes ${want} argument(s), got ${args.length} (at ${t.pos})`, t.pos)
      }
      return { t: 'call', fn: t.name, args }
    }
    if (t.k === 'op' && t.op === '(') {
      this.i++
      this.enter(t.pos)
      const inner = this.or()
      this.expect(')')
      this.depth--
      return inner
    }
    this.fail(t)
  }
}

function collectRefs(ast: FormulaAst, out: FormulaRef[], seen: Set<string>): void {
  switch (ast.t) {
    case 'num':
      return
    case 'ref': {
      const id = `${ast.ref.kind}.${ast.ref.key}`
      if (!seen.has(id)) {
        seen.add(id)
        out.push(ast.ref)
      }
      return
    }
    case 'neg':
      return collectRefs(ast.arg, out, seen)
    case 'bin':
      collectRefs(ast.left, out, seen)
      return collectRefs(ast.right, out, seen)
    case 'call':
      for (const a of ast.args) collectRefs(a, out, seen)
  }
}

export function parseFormula(src: string): ParseResult {
  if (src.length > FORMULA_MAX_LENGTH) {
    return { ok: false, error: `Formula is longer than ${FORMULA_MAX_LENGTH} characters`, position: FORMULA_MAX_LENGTH }
  }
  try {
    const ast = new Parser(tokenize(src)).parse()
    const refs: FormulaRef[] = []
    collectRefs(ast, refs, new Set())
    return { ok: true, ast, refs }
  } catch (e) {
    if (e instanceof FormulaError) return { ok: false, error: e.message, position: e.position }
    throw e
  }
}

const finite = (n: number): number | null => (Number.isFinite(n) ? n : null)
const truthy = (n: number | null): boolean => n !== null && n !== 0

export function evalFormula(ast: FormulaAst, scope: FormulaScope): number | null {
  const v = (a: FormulaAst) => evalFormula(a, scope)
  switch (ast.t) {
    case 'num':
      return finite(ast.value)
    case 'ref': {
      const { kind, key } = ast.ref
      const raw = kind === 'answers' ? scope.answer(key) : kind === 'facts' ? scope.fact(key) : scope.computed(key)
      return raw === null || typeof raw !== 'number' ? null : finite(raw)
    }
    case 'neg': {
      const a = v(ast.arg)
      return a === null ? null : finite(-a)
    }
    case 'bin': {
      if (ast.op === '&&') return truthy(v(ast.left)) && truthy(v(ast.right)) ? 1 : 0
      if (ast.op === '||') return truthy(v(ast.left)) || truthy(v(ast.right)) ? 1 : 0
      const a = v(ast.left)
      const b = v(ast.right)
      if (a === null || b === null) return null
      switch (ast.op) {
        case '+': return finite(a + b)
        case '-': return finite(a - b)
        case '*': return finite(a * b)
        case '/': return finite(a / b)
        case '%': return finite(a % b)
        case '^': return finite(a ** b)
        case '<': return a < b ? 1 : 0
        case '<=': return a <= b ? 1 : 0
        case '>': return a > b ? 1 : 0
        case '>=': return a >= b ? 1 : 0
        case '==': return a === b ? 1 : 0
        case '!=': return a !== b ? 1 : 0
      }
    }
    case 'call': {
      if (ast.fn === 'if') return truthy(v(ast.args[0]!)) ? v(ast.args[1]!) : v(ast.args[2]!)
      const args = ast.args.map(v)
      if (args.some((a) => a === null)) return null
      const n = args as number[]
      switch (ast.fn) {
        case 'round': {
          const p = 10 ** (n[1] ?? 0)
          return finite(Math.round(n[0]! * p) / p)
        }
        case 'floor': return finite(Math.floor(n[0]!))
        case 'ceil': return finite(Math.ceil(n[0]!))
        case 'abs': return finite(Math.abs(n[0]!))
        case 'min': return finite(Math.min(...n))
        case 'max': return finite(Math.max(...n))
      }
    }
  }
  return null
}
