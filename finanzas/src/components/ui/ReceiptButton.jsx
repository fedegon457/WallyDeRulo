import { useRef, useState } from 'react'
import { IconCamera, IconTrash, IconRefresh } from '@tabler/icons-react'
import { supabase } from '../../lib/supabase'

async function compressImage(file, maxWidth = 1600, quality = 0.8) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale   = Math.min(1, maxWidth / img.naturalWidth)
      const canvas  = document.createElement('canvas')
      canvas.width  = Math.round(img.naturalWidth  * scale)
      canvas.height = Math.round(img.naturalHeight * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      canvas.toBlob(resolve, 'image/jpeg', quality)
    }
    img.src = url
  })
}

export function ReceiptButton({ transactionId, userId, receiptUrl, onUpdate }) {
  const inputRef  = useRef(null)
  const [viewing,   setViewing]   = useState(false)
  const [signedUrl, setSignedUrl] = useState(null)
  const [uploading, setUploading] = useState(false)

  const storagePath = `${userId}/${transactionId}.jpg`

  const openViewer = async () => {
    setViewing(true)
    const { data } = await supabase.storage
      .from('receipts')
      .createSignedUrl(storagePath, 3600)
    if (data) setSignedUrl(data.signedUrl)
  }

  const handleClick = () => {
    if (receiptUrl) openViewer()
    else            inputRef.current?.click()
  }

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const blob = await compressImage(file)
      const { error } = await supabase.storage
        .from('receipts')
        .upload(storagePath, blob, { upsert: true, contentType: 'image/jpeg' })
      if (!error) {
        await supabase.from('transactions')
          .update({ receipt_url: storagePath })
          .eq('id', transactionId)
        onUpdate(storagePath)
        openViewer()
      }
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDelete = async () => {
    await supabase.storage.from('receipts').remove([storagePath])
    await supabase.from('transactions')
      .update({ receipt_url: null })
      .eq('id', transactionId)
    onUpdate(null)
    setSignedUrl(null)
    setViewing(false)
  }

  const handleReplace = () => {
    setViewing(false)
    setTimeout(() => inputRef.current?.click(), 100)
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={handleFile}
      />

      <button
        onClick={handleClick}
        disabled={uploading}
        title={receiptUrl ? 'Ver comprobante' : 'Adjuntar comprobante'}
        className={`p-1.5 rounded-lg transition ${
          receiptUrl
            ? 'text-primary-500 hover:bg-primary-50'
            : 'text-gray-300 hover:bg-gray-100 hover:text-gray-500'
        }`}
      >
        {uploading
          ? <div className="w-3.5 h-3.5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          : <IconCamera size={14} />
        }
      </button>

      {viewing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90"
          onClick={() => { setViewing(false); setSignedUrl(null) }}
        >
          <div className="relative max-w-sm w-full space-y-4" onClick={e => e.stopPropagation()}>
            <div className="bg-gray-900 rounded-2xl overflow-hidden min-h-40 flex items-center justify-center">
              {signedUrl
                ? <img
                    src={signedUrl}
                    alt="Comprobante"
                    className="w-full object-contain max-h-[65vh] rounded-2xl"
                  />
                : <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full" />
              }
            </div>
            <div className="flex gap-2 justify-center">
              <button
                onClick={handleReplace}
                className="flex items-center gap-1.5 px-4 py-2 bg-white/15 backdrop-blur rounded-xl text-white text-sm font-medium hover:bg-white/25 transition"
              >
                <IconRefresh size={14} /> Reemplazar
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-500/80 backdrop-blur rounded-xl text-white text-sm font-medium hover:bg-red-500 transition"
              >
                <IconTrash size={14} /> Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
