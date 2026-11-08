import { useEffect, useRef, useState } from 'react'
import {
  Camera,
  FilePlus2,
  Mic,
  Music2,
  Paperclip,
  Square,
  Trash2,
  Video,
} from 'lucide-react'
import type { Attachment, AttachmentKind, PendingAttachment } from '../types'
import { attachmentLabel, formatBytes } from '../utils'

interface AttachmentEditorProps {
  existingAttachments: Attachment[]
  pendingAttachments: PendingAttachment[]
  removedAttachmentIds: string[]
  onAddPending: (items: PendingAttachment[]) => void
  onRemovePending: (index: number) => void
  onRemoveExisting: (id: string) => void
  onError: (message: string) => void
}

const MAX_FILE_SIZE = 120 * 1024 * 1024

function FileGlyph({ kind }: { kind: AttachmentKind }) {
  if (kind === 'image') return <Camera size={16} />
  if (kind === 'audio') return <Music2 size={16} />
  if (kind === 'video') return <Video size={16} />
  return <FilePlus2 size={16} />
}

export function AttachmentEditor({
  existingAttachments,
  pendingAttachments,
  removedAttachmentIds,
  onAddPending,
  onRemovePending,
  onRemoveExisting,
  onError,
}: AttachmentEditorProps) {
  const imageInput = useRef<HTMLInputElement>(null)
  const audioInput = useRef<HTMLInputElement>(null)
  const videoInput = useRef<HTMLInputElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const startedAtRef = useRef(0)
  const [recording, setRecording] = useState(false)
  const [recordSeconds, setRecordSeconds] = useState(0)

  useEffect(() => {
    if (!recording) return
    const timer = window.setInterval(() => {
      setRecordSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000))
    }, 500)
    return () => window.clearInterval(timer)
  }, [recording])

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  const addFiles = (files: FileList | null, kind: AttachmentKind) => {
    if (!files?.length) return
    const accepted: PendingAttachment[] = []
    Array.from(files).forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        onError(`「${file.name}」超过 120 MB，暂未添加`)
        return
      }
      accepted.push({ kind, file })
    })
    if (accepted.length) onAddPending(accepted)
  }

  const handleInput = (
    event: React.ChangeEvent<HTMLInputElement>,
    kind: AttachmentKind,
  ) => {
    addFiles(event.currentTarget.files, kind)
    event.currentTarget.value = ''
  }

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      onError('当前浏览器不支持直接录音，可以改用上传音频文件。')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const preferredType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'].find(
        (type) => MediaRecorder.isTypeSupported(type),
      )
      const recorder = new MediaRecorder(
        stream,
        preferredType ? { mimeType: preferredType } : undefined,
      )
      chunksRef.current = []
      streamRef.current = stream
      recorderRef.current = recorder
      startedAtRef.current = Date.now()
      setRecordSeconds(0)

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }
      recorder.onstop = () => {
        const type = recorder.mimeType || 'audio/webm'
        const extension = type.includes('mp4') ? 'm4a' : 'webm'
        const blob = new Blob(chunksRef.current, { type })
        const file = new File([blob], `语音记录-${Date.now()}.${extension}`, { type })
        const duration = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000))
        onAddPending([{ kind: 'audio', file, duration }])
        stream.getTracks().forEach((track) => track.stop())
        streamRef.current = null
        recorderRef.current = null
        setRecording(false)
        setRecordSeconds(0)
      }

      recorder.start()
      setRecording(true)
    } catch {
      onError('无法启动麦克风，请检查浏览器录音权限。')
    }
  }

  const stopRecording = () => {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop()
    }
  }

  const visibleExisting = existingAttachments.filter(
    (attachment) => !removedAttachmentIds.includes(attachment.id),
  )

  return (
    <div className="attachment-editor">
      <div className="attachment-actions">
        <button type="button" className="soft-button" onClick={() => imageInput.current?.click()}>
          <Camera size={17} /> 图片
        </button>
        <button type="button" className="soft-button" onClick={() => videoInput.current?.click()}>
          <Video size={17} /> 短视频
        </button>
        <button
          type="button"
          className={`soft-button${recording ? ' recording' : ''}`}
          onClick={recording ? stopRecording : startRecording}
        >
          {recording ? <Square size={15} /> : <Mic size={17} />}
          {recording ? `停止录音 ${recordSeconds}s` : '录一段语音'}
        </button>
        <button type="button" className="soft-button" onClick={() => audioInput.current?.click()}>
          <Music2 size={17} /> 音频文件
        </button>
        <button type="button" className="soft-button" onClick={() => fileInput.current?.click()}>
          <Paperclip size={17} /> 文件
        </button>
      </div>

      <input ref={imageInput} type="file" accept="image/*" multiple hidden onChange={(event) => handleInput(event, 'image')} />
      <input ref={videoInput} type="file" accept="video/*" multiple hidden onChange={(event) => handleInput(event, 'video')} />
      <input ref={audioInput} type="file" accept="audio/*" multiple hidden onChange={(event) => handleInput(event, 'audio')} />
      <input ref={fileInput} type="file" multiple hidden onChange={(event) => handleInput(event, 'file')} />

      {(visibleExisting.length > 0 || pendingAttachments.length > 0) && (
        <div className="attachment-edit-list">
          {visibleExisting.map((attachment) => (
            <div className="attachment-edit-item" key={attachment.id}>
              <span className="attachment-edit-icon">
                <FileGlyph kind={attachment.kind} />
              </span>
              <span className="attachment-edit-copy">
                <strong>{attachment.name}</strong>
                <small>{attachmentLabel(attachment.kind)} · {formatBytes(attachment.size)}</small>
              </span>
              <button
                type="button"
                className="icon-button danger-hover"
                aria-label={`删除附件 ${attachment.name}`}
                onClick={() => onRemoveExisting(attachment.id)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}

          {pendingAttachments.map((pending, index) => (
            <div className="attachment-edit-item pending" key={`${pending.file.name}-${index}`}>
              <span className="attachment-edit-icon">
                <FileGlyph kind={pending.kind} />
              </span>
              <span className="attachment-edit-copy">
                <strong>{pending.file.name}</strong>
                <small>{attachmentLabel(pending.kind)} · {formatBytes(pending.file.size)} · 待保存</small>
              </span>
              <button
                type="button"
                className="icon-button danger-hover"
                aria-label={`移除待保存附件 ${pending.file.name}`}
                onClick={() => onRemovePending(index)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="field-hint">
        附件保存在当前设备的 IndexedDB 中。单个文件建议不超过 120 MB，大量视频可能占用较多空间。
      </p>
    </div>
  )
}
