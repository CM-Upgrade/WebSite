export const getBasePath = () => {
  return process.env.NODE_ENV === 'production' ? '/WebSite' : ''
}

export const getImagePath = (src: string) => {
  const basePath = getBasePath()
  return `${basePath}${src}`
}