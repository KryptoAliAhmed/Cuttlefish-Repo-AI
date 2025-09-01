"use client"

import * as React from "react"
import { useToast as useToastBase } from "@/components/ui/use-toast"

export const useToast = () => {
  const { toast } = useToastBase()
  
  return {
    toast: (props: {
      title?: string
      description?: string
      duration?: number
      variant?: "default" | "destructive"
    }) => {
      toast({
        title: props.title,
        description: props.description,
        duration: props.duration || 3000,
        variant: props.variant || "default",
      })
    }
  }
}


