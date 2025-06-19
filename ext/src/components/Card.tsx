import Avatar from "boring-avatars"
import clsx from "clsx"
import React from "react"

export function Card({
  children,
  className = ""
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={clsx("w-24 bg-white rounded shadow-sm p-3", className)}>
      {children}
    </div>
  )
}

Card.Header = function CardHeader({
  name,
  image,
  title,
  subtitle
}: {
  name?: string
  image?: string
  title?: string
  subtitle?: string
}) {
  return (
    <div className="flex items-center gap-2 mb-2">
      {image ? (
        <img
          src={image}
          alt={title}
          className="w-8 h-8 rounded-full object-cover"
        />
      ) : name ? (
        <Avatar name={name} size={12} />
      ) : null}

      <div>
        {title && <p className="text-gray-800 font-medium">{title}</p>}
        {subtitle && <p className="text-gray-400 text-xs">{subtitle}</p>}
      </div>
    </div>
  )
}

Card.Image = function CardImage({ src, alt }: { src: string; alt?: string }) {
  return (
    <div className="rounded-lg overflow-hidden mb-2">
      <img src={src} alt={alt} className="w-full object-cover" />
    </div>
  )
}

Card.Body = function CardBody({ children }: { children: React.ReactNode }) {
  return <div className="text-gray-700 mb-2">{children}</div>
}

Card.Footer = function CardFooter({ children }: { children: React.ReactNode }) {
  return <div className="flex justify-between items-center">{children}</div>
}

Card.ImageCover = function CardImageCover({ src, alt }: { src: string; alt?: string }) {
  return (
    <img
      src={src}
      alt={alt}
      className="rounded object-cover aspect-square w-full"
    />
  )
}

const MAX_LENGTH_LAST = 20
const MAX_LENGTH_MIDDLE = 6
const MAX_LENGTH_FROM_START = 4
const MAX_LENGTH_FROM_END = 2

/**
 * Example
 * Option "MIDDLE" → start...end
 * Option "LAST"   → start...
 */
export function getEllipsedText(
  text: string,
  option: "MIDDLE" | "LAST" = "MIDDLE"
) {
  const length = text.length

  if (option === "LAST") {
    if (length <= MAX_LENGTH_LAST) return text
    return text.slice(0, MAX_LENGTH_LAST) + "..."
  }

  if (length <= MAX_LENGTH_MIDDLE) return text
  const start = text.slice(0, MAX_LENGTH_FROM_START)
  const end = text.slice(-MAX_LENGTH_FROM_END)
  return `${start}...${end}`
}

