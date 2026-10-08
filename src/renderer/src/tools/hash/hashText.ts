import CryptoJS from 'crypto-js'

export type HashAlgo = 'MD5' | 'SHA1' | 'SHA256'

export function hashText(algo: HashAlgo, text: string): string {
  switch (algo) {
    case 'MD5':
      return CryptoJS.MD5(text).toString()
    case 'SHA1':
      return CryptoJS.SHA1(text).toString()
    case 'SHA256':
      return CryptoJS.SHA256(text).toString()
  }
}
