// Se usar shadcn: ajuste para o seu caminho util de "cn"
export function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}