import { sections } from '@/features/script/uirouuri'

/** 全セリフ(通し番号順)。タイムタグはこの順に対応する。 */
export const phrases = sections.flatMap((section) => section.phrases)
