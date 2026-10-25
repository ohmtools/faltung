import { Fragment } from 'react'

/** Setzt Teile in einen Text mit Platzhaltern ein: fill('So entsteht {fg}', { fg: <Tex … /> }). */
export function fill(text: string, parts: Record<string, React.ReactNode>): React.ReactNode {
  return text.split(/(\{\w+\})/).map((part, i) => {
    const key = /^\{(\w+)\}$/.exec(part)?.[1]
    return <Fragment key={i}>{key ? parts[key] : part}</Fragment>
  })
}
