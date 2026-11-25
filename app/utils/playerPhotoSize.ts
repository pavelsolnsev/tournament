export const playerPhotoMaxBytes = 20_000
export const playerPhotoTargetBytes = 10_000
export const playerPhotoDimensions = [128, 96, 64] as const

export function base64ByteLength(base64: string) {
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0
  return Math.floor(base64.length * 3 / 4) - padding
}
