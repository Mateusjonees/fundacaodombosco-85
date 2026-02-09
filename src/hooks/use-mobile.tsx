import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < MOBILE_BREAKPOINT || 
        (window.innerHeight < 500 && window.innerWidth < 1024)
    }
    return false
  })

  React.useEffect(() => {
    const checkMobile = () => {
      // Portrait mobile OR landscape phone (short height + moderate width)
      const isPortraitMobile = window.innerWidth < MOBILE_BREAKPOINT
      const isLandscapePhone = window.innerHeight < 500 && window.innerWidth < 1024
      setIsMobile(isPortraitMobile || isLandscapePhone)
    }
    
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const orientationMql = window.matchMedia('(orientation: landscape) and (max-height: 500px)')
    
    const onChange = () => checkMobile()
    
    mql.addEventListener("change", onChange)
    orientationMql.addEventListener("change", onChange)
    window.addEventListener("resize", onChange)
    
    checkMobile()
    
    return () => {
      mql.removeEventListener("change", onChange)
      orientationMql.removeEventListener("change", onChange)
      window.removeEventListener("resize", onChange)
    }
  }, [])

  return isMobile
}

export function useIsLandscape() {
  const [isLandscape, setIsLandscape] = React.useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth > window.innerHeight && window.innerHeight < 500
    }
    return false
  })

  React.useEffect(() => {
    const check = () => {
      setIsLandscape(window.innerWidth > window.innerHeight && window.innerHeight < 500)
    }
    
    window.addEventListener("resize", check)
    const mql = window.matchMedia('(orientation: landscape)')
    mql.addEventListener("change", check)
    check()
    
    return () => {
      window.removeEventListener("resize", check)
      mql.removeEventListener("change", check)
    }
  }, [])

  return isLandscape
}