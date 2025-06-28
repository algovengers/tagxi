export interface TagMetadata {
  startTagPath: string
  endTagPath: string
  startOffset: number
  endOffset: number
}

export interface TagDetails {
  site: string
  metadata: TagMetadata
}
