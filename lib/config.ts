export const getBasePath = () => {
  // No base path needed for custom domain
  return ''
}

export const getImagePath = (src: string) => {
  const basePath = getBasePath()
  return `${basePath}${src}`
}