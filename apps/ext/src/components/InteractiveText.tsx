import { CopyCheckIcon, CopyIcon } from "lucide-react"
import { useState } from "react"

interface InteractiveTextProps {
  text: string
  alternateTextToCopy?: string
}

export default function InteractiveText({
  text,
  alternateTextToCopy
}: InteractiveTextProps) {
  const [copiedUsername, setUsernameCopied] = useState(false)

  const handleCopyText = () => {
    navigator.clipboard.writeText(
      alternateTextToCopy ? alternateTextToCopy : text
    )
    setUsernameCopied(true)
    setTimeout(() => setUsernameCopied(false), 2000)
  }
  return (
    <div
      onClick={handleCopyText}
      className="flex items-center gap-2 group cursor-pointer rounded-lg px-2 py-1 transition-colors hover:bg-gray-200">
      <p className="text-gray-500 font-bold group-hover:text-gray-700">
        {text}
      </p>
      {copiedUsername ? (
        <CopyCheckIcon size={12} className="stroke-black" />
      ) : (
        <CopyIcon
          size={12}
          className="stroke-black group-hover:stroke-gray-600"
        />
      )}
    </div>
  )
}
