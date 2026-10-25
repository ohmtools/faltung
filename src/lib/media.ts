// Die Stufen aus index.css als Media-Queries, für die Stellen, die sie im Script brauchen: welcher
// Behälter die Einstellungen trägt und wie die Bedienleiste steht.
export const COMPACT_QUERY = '(width >= 40rem), (height < 600px) and (orientation: landscape)'
export const WIDE_QUERY = '(width >= 64rem) and (height >= 600px)'
/** Breit genug für die Formelzeile über dem Plot (Tailwinds `lg:`) */
export const LG_QUERY = '(width >= 64rem)'
