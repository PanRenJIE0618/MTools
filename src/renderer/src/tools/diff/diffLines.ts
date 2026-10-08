export type DiffLine = { type: 'same' | 'add' | 'del'; text: string }

export function diffLines(a: string, b: string): DiffLine[] {
  if (a === '' && b === '') return []

  const linesA = a.split('\n')
  const linesB = b.split('\n')
  const m = linesA.length
  const n = linesB.length

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array<number>(n + 1).fill(0))

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (linesA[i - 1] === linesB[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  const stack: DiffLine[] = []
  let i = m
  let j = n

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && linesA[i - 1] === linesB[j - 1]) {
      stack.push({ type: 'same', text: linesA[i - 1] })
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      stack.push({ type: 'add', text: linesB[j - 1] })
      j--
    } else {
      stack.push({ type: 'del', text: linesA[i - 1] })
      i--
    }
  }

  return stack.reverse()
}
