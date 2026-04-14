"use client"

import * as React from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { SmileIcon } from "lucide-react"
import dynamic from "next/dynamic"
import { useTheme } from "next-themes"
import { Theme } from "emoji-picker-react"

// Import EmojiPicker dynamically to avoid SSR issues
const Picker = dynamic(() => import("emoji-picker-react"), { ssr: false })

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
  children?: React.ReactNode;
}

export function EmojiPicker({ value, onChange, children }: EmojiPickerProps) {
  const [open, setOpen] = React.useState(false)
  const { theme } = useTheme()

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        {children || (
          <Button variant="outline" size="icon" className="size-10 rounded-xl">
            {value || <SmileIcon className="size-5" />}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="p-0 border-none shadow-2xl rounded-2xl bg-transparent w-[90vw] max-w-[350px]" align="center" side="bottom" sideOffset={10}>
        <div className="flex w-full items-center justify-center">
          <Picker
            onEmojiClick={(emojiData) => {
              onChange(emojiData.emoji)
              setOpen(false)
            }}
            theme={theme === "dark" ? Theme.DARK : Theme.LIGHT}
            lazyLoadEmojis={true}
            searchPlaceholder="Pesquisar emoji..."
            previewConfig={{ showPreview: false }}
            skinTonesDisabled={true}
            width="100%"
            height={400}
            autoFocusSearch={false}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
