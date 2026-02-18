// src/components/PhoneLink.js
'use client'

import { useEffect, useState } from 'react'

export default function PhoneLink({ phoneNumber }) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return <span>{phoneNumber}</span>
  }

  return (
    <a href={`tel:${phoneNumber}`}>{phoneNumber}</a>
  )
}