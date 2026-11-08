import { useState } from 'react'
import { Download, FileText, Image, Music2, Play, X } from 'lucide-react'
import type { Attachment } from '../types'
import { attachmentLabel, formatBytes } from '../utils'
import { useObjectUrl } from '../hooks/useObjectUrl'

function ImageAttachment({ attachment, onPreview }: { attachment: Attachment; onPreview: (url: string) => void }) {
  const url = useObjectUrl(attachment.blob)
  if (!url) return null
  return (
    <button type="button" className="gallery-image" onClick={() => onPreview(url)}>
      <img src={url} alt={attachment.name} loading="lazy" />
      <span className="gallery-image-overlay">
        <Image size={16} />
        查看大图
      </span>
    </button>
  )
}

function AudioAttachment({ attachment }: { attachment: Attachment }) {
  const url = useObjectUrl(attachment.blob)
  if (!url) return null
  return (
    <div className="gallery-media-card">
      <div className="gallery-media-heading">
        <span className="gallery-media-icon">
          <Music2 size={18} />
        </span>
        <span>
          <strong>{attachment.name}</strong>
          <small>{attachmentLabel(attachment.kind)} · {formatBytes(attachment.size)}</small>
        </span>
      </div>
      <audio controls preload="metadata" src={url}>
        您的浏览器不支持音频播放。
      </audio>
    </div>
  )
}

function VideoAttachment({ attachment }: { attachment: Attachment }) {
  const url = useObjectUrl(attachment.blob)
  if (!url) return null
  return (
    <div className="gallery-video-card">
      <video controls preload="metadata" src={url}>
        您的浏览器不支持视频播放。
      </video>
      <div className="gallery-video-caption">
        <span>
          <Play size={14} />
          {attachment.name}
        </span>
        <small>{formatBytes(attachment.size)}</small>
      </div>
    </div>
  )
}

function FileAttachment({ attachment }: { attachment: Attachment }) {
  const url = useObjectUrl(attachment.blob)
  if (!url) return null
  return (
    <a className="gallery-file-card" href={url} download={attachment.name}>
      <span className="gallery-media-icon">
        <FileText size={18} />
      </span>
      <span className="gallery-file-copy">
        <strong>{attachment.name}</strong>
        <small>{formatBytes(attachment.size)}</small>
      </span>
      <Download size={17} />
    </a>
  )
}

export function AttachmentGallery({ attachments }: { attachments: Attachment[] }) {
  const [previewUrl, setPreviewUrl] = useState('')

  if (!attachments.length) return null

  return (
    <>
      <div className="attachment-gallery">
        {attachments.map((attachment) => {
          if (attachment.kind === 'image') {
            return (
              <ImageAttachment
                key={attachment.id}
                attachment={attachment}
                onPreview={setPreviewUrl}
              />
            )
          }
          if (attachment.kind === 'audio') {
            return <AudioAttachment key={attachment.id} attachment={attachment} />
          }
          if (attachment.kind === 'video') {
            return <VideoAttachment key={attachment.id} attachment={attachment} />
          }
          return <FileAttachment key={attachment.id} attachment={attachment} />
        })}
      </div>

      {previewUrl && (
        <div className="lightbox" role="dialog" aria-modal="true" onClick={() => setPreviewUrl('')}>
          <button
            type="button"
            className="lightbox-close"
            aria-label="关闭图片预览"
            onClick={() => setPreviewUrl('')}
          >
            <X size={22} />
          </button>
          <img src={previewUrl} alt="附件大图" onClick={(event) => event.stopPropagation()} />
        </div>
      )}
    </>
  )
}
