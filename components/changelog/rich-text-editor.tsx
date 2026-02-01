'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Image,
  Video,
  FileText,
  Music,
  Link,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Eye,
  X,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  onPreview?: (content: string) => void
}

export function RichTextEditor({ content, onChange, onPreview }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [showMediaDialog, setShowMediaDialog] = useState(false)
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'audio' | 'file'>('image')
  const [mediaUrl, setMediaUrl] = useState('')
  const [videoSettings, setVideoSettings] = useState({
    autoplay: false,
    loop: false,
    muted: false,
    controls: true,
    speed: '1x',
  })
  const lastSelectionRef = useRef<Range | null>(null)
  const isInternalChangeRef = useRef(false)
  const contentSyncedRef = useRef(false)

  const lastContentRef = useRef<string>('')

  // Initialize content only once
  useEffect(() => {
    if (editorRef.current && !contentSyncedRef.current) {
      isInternalChangeRef.current = true
      const initialContent = content || '<p><br></p>'
      editorRef.current.innerHTML = initialContent
      lastContentRef.current = initialContent
      contentSyncedRef.current = true
      isInternalChangeRef.current = false
    }
  }, [])

  // Sync content prop to editor (only when changed externally, not from user input)
  useEffect(() => {
    if (editorRef.current && contentSyncedRef.current && !isInternalChangeRef.current) {
      const currentContent = editorRef.current.innerHTML
      // Only update if content prop changed externally (different from what we last set)
      // This prevents syncing when user is typing (which triggers onChange -> parent update -> prop change)
      if (content !== undefined && content !== lastContentRef.current && content !== currentContent) {
        // This is an external change (e.g., loading existing entry)
        const selection = window.getSelection()
        let savedRange: Range | null = null
        if (selection && selection.rangeCount > 0) {
          try {
            savedRange = selection.getRangeAt(0).cloneRange()
          } catch (e) {
            // Ignore
          }
        }
        
        isInternalChangeRef.current = true
        const newContent = content || '<p><br></p>'
        editorRef.current.innerHTML = newContent
        lastContentRef.current = newContent
        
        // Try to restore selection
        setTimeout(() => {
          if (savedRange && editorRef.current?.contains(savedRange.commonAncestorContainer)) {
            try {
              const selection = window.getSelection()
              if (selection) {
                selection.removeAllRanges()
                selection.addRange(savedRange)
                lastSelectionRef.current = savedRange
              }
            } catch (e) {
              // If selection is invalid, place at end
              const selection = window.getSelection()
              if (selection && editorRef.current) {
                const range = document.createRange()
                range.selectNodeContents(editorRef.current)
                range.collapse(false)
                selection.removeAllRanges()
                selection.addRange(range)
                lastSelectionRef.current = range.cloneRange()
              }
            }
          }
          isInternalChangeRef.current = false
        }, 0)
      }
    }
  }, [content])

  const saveSelection = useCallback(() => {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0 && editorRef.current?.contains(selection.anchorNode)) {
      try {
        lastSelectionRef.current = selection.getRangeAt(0).cloneRange()
      } catch (e) {
        // Ignore
      }
    }
  }, [])

  const restoreSelection = useCallback(() => {
    if (lastSelectionRef.current && editorRef.current) {
      const selection = window.getSelection()
      if (selection) {
        try {
          const range = lastSelectionRef.current
          // Check if range is still valid
          if (range && range.commonAncestorContainer && editorRef.current.contains(range.commonAncestorContainer)) {
            // Verify start and end containers are still in the editor
            const startContainer = range.startContainer
            const endContainer = range.endContainer
            
            if (editorRef.current.contains(startContainer) && editorRef.current.contains(endContainer)) {
              selection.removeAllRanges()
              selection.addRange(range)
              return
            }
          }
        } catch (e) {
          // Range is invalid, will try to restore at end
        }
        
        // If we get here, try to place cursor at the end of current content
        try {
          const selection = window.getSelection()
          if (selection && editorRef.current) {
            const range = document.createRange()
            // Find the last text node or element
            const walker = document.createTreeWalker(
              editorRef.current,
              NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
              null
            )
            
            let lastNode: Node | null = null
            while (walker.nextNode()) {
              lastNode = walker.currentNode
            }
            
            if (lastNode) {
              if (lastNode.nodeType === Node.TEXT_NODE) {
                range.setStart(lastNode, lastNode.textContent?.length || 0)
                range.setEnd(lastNode, lastNode.textContent?.length || 0)
              } else {
                range.setStartAfter(lastNode)
                range.setEndAfter(lastNode)
              }
            } else {
              range.selectNodeContents(editorRef.current)
              range.collapse(false)
            }
            
            selection.removeAllRanges()
            selection.addRange(range)
            lastSelectionRef.current = range.cloneRange()
          }
        } catch (e2) {
          // Ignore - cursor will stay where it is
        }
      }
    }
  }, [])

  const execCommand = useCallback((command: string, value?: string) => {
    saveSelection()
    document.execCommand(command, false, value)
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
    setTimeout(() => {
      restoreSelection()
    }, 0)
  }, [onChange, saveSelection, restoreSelection])

  const insertHTML = useCallback((html: string) => {
    saveSelection()
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      range.deleteContents()
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = html
      const fragment = document.createDocumentFragment()
      while (tempDiv.firstChild) {
        fragment.appendChild(tempDiv.firstChild)
      }
      range.insertNode(fragment)
      // Move cursor after inserted content
      range.setStartAfter(fragment.lastChild || range.endContainer)
      range.collapse(true)
      selection.removeAllRanges()
      selection.addRange(range)
      lastSelectionRef.current = range.cloneRange()
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML)
      }
    }
  }, [onChange, saveSelection])

  const handleMediaInsert = () => {
    if (!mediaUrl.trim()) {
      alert('Please enter a URL or upload a file')
      return
    }

    let html = ''
    if (mediaType === 'image') {
      html = `<img src="${mediaUrl}" alt="" style="max-width: 100%; height: auto; border-radius: 8px; margin: 12px 0; display: block;" />`
    } else if (mediaType === 'video') {
      const attrs = [
        `src="${mediaUrl}"`,
        videoSettings.autoplay ? 'autoplay' : '',
        videoSettings.loop ? 'loop' : '',
        videoSettings.muted ? 'muted' : '',
        videoSettings.controls ? 'controls' : '',
        `style="max-width: 100%; border-radius: 8px; margin: 12px 0; display: block;"`,
      ].filter(Boolean).join(' ')
      html = `<video ${attrs}></video>`
    } else if (mediaType === 'audio') {
      const attrs = [
        `src="${mediaUrl}"`,
        videoSettings.autoplay ? 'autoplay' : '',
        videoSettings.loop ? 'loop' : '',
        videoSettings.controls ? 'controls' : '',
        `style="width: 100%; margin: 12px 0; display: block;"`,
      ].filter(Boolean).join(' ')
      html = `<audio ${attrs}></audio>`
    } else {
      html = `<a href="${mediaUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 4px; color: #f59e0b; text-decoration: underline;">
        📄 ${mediaUrl.split('/').pop() || 'File'}
      </a>`
    }

    insertHTML(html)
    setShowMediaDialog(false)
    setMediaUrl('')
    setVideoSettings({
      autoplay: false,
      loop: false,
      muted: false,
      controls: true,
      speed: '1x',
    })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // In production, upload to Supabase Storage or your CDN
    // For now, create a data URL or use a placeholder
    const reader = new FileReader()
    reader.onload = (event) => {
      const url = event.target?.result as string
      setMediaUrl(url)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="border border-amber-200 rounded-lg bg-white">
      {/* Toolbar */}
      <div className="border-b border-amber-200 bg-amber-50/50 p-2 flex flex-wrap items-center gap-1">
        {/* Font Controls */}
        <Select defaultValue="16" onValueChange={(v) => execCommand('fontSize', v)}>
          <SelectTrigger className="h-8 w-20 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="8">8px</SelectItem>
            <SelectItem value="10">10px</SelectItem>
            <SelectItem value="12">12px</SelectItem>
            <SelectItem value="14">14px</SelectItem>
            <SelectItem value="16">16px</SelectItem>
            <SelectItem value="18">18px</SelectItem>
            <SelectItem value="20">20px</SelectItem>
            <SelectItem value="24">24px</SelectItem>
            <SelectItem value="32">32px</SelectItem>
            <SelectItem value="48">48px</SelectItem>
          </SelectContent>
        </Select>

        <Select defaultValue="Arial" onValueChange={(v) => execCommand('fontName', v)}>
          <SelectTrigger className="h-8 w-32 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Arial">Arial</SelectItem>
            <SelectItem value="Helvetica">Helvetica</SelectItem>
            <SelectItem value="Times New Roman">Times New Roman</SelectItem>
            <SelectItem value="Courier New">Courier New</SelectItem>
            <SelectItem value="Georgia">Georgia</SelectItem>
            <SelectItem value="Verdana">Verdana</SelectItem>
            <SelectItem value="Comic Sans MS">Comic Sans MS</SelectItem>
          </SelectContent>
        </Select>

        <div className="w-px h-6 bg-amber-200 mx-1" />

        {/* Text Formatting */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => execCommand('bold')}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => execCommand('italic')}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => execCommand('underline')}
          title="Underline"
        >
          <Underline className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => execCommand('strikeThrough')}
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-amber-200 mx-1" />

        {/* Headings */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => execCommand('formatBlock', '<h1>')}
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => execCommand('formatBlock', '<h2>')}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => execCommand('formatBlock', '<h3>')}
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-amber-200 mx-1" />

        {/* Lists */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => execCommand('insertUnorderedList')}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => execCommand('insertOrderedList')}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => execCommand('formatBlock', '<blockquote>')}
          title="Quote"
        >
          <Quote className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-amber-200 mx-1" />

        {/* Alignment */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => execCommand('justifyLeft')}
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => execCommand('justifyCenter')}
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => execCommand('justifyRight')}
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-amber-200 mx-1" />

        {/* Media */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-amber-100"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setMediaType('image')
            setMediaUrl('')
            setShowMediaDialog(true)
          }}
          title="Insert Image"
        >
          <Image className="h-4 w-4 text-amber-600" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-amber-100"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setMediaType('video')
            setMediaUrl('')
            setShowMediaDialog(true)
          }}
          title="Insert Video"
        >
          <Video className="h-4 w-4 text-amber-600" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-amber-100"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setMediaType('audio')
            setMediaUrl('')
            setShowMediaDialog(true)
          }}
          title="Insert Audio"
        >
          <Music className="h-4 w-4 text-amber-600" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-amber-100"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setMediaType('file')
            setMediaUrl('')
            setShowMediaDialog(true)
          }}
          title="Insert File"
        >
          <FileText className="h-4 w-4 text-amber-600" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => {
            const url = prompt('Enter URL:')
            if (url) {
              insertHTML(`<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #f59e0b; text-decoration: underline;">${url}</a>`)
            }
          }}
          title="Insert Link"
        >
          <Link className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-amber-200 mx-1" />

        {/* Undo/Redo */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => execCommand('undo')}
          title="Undo"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => execCommand('redo')}
          title="Redo"
        >
          <Redo className="h-4 w-4" />
        </Button>

        {onPreview && (
          <>
            <div className="w-px h-6 bg-amber-200 mx-1" />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => onPreview(editorRef.current?.innerHTML || '')}
              title="Preview"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {/* Editor */}
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          className="min-h-[400px] p-4 focus:outline-none prose prose-sm max-w-none break-words [&_img]:max-w-full [&_img]:h-auto [&_img]:cursor-pointer [&_video]:max-w-full [&_video]:h-auto [&_video]:cursor-pointer [&_audio]:max-w-full [&_audio]:cursor-pointer [&_*]:max-w-full [&_*]:break-words"
          style={{
            fontFamily: 'inherit',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
          }}
          onInput={(e) => {
            if (!isInternalChangeRef.current && editorRef.current) {
              const newContent = editorRef.current.innerHTML
              lastContentRef.current = newContent
              onChange(newContent)
              // Save selection after input (cursor should be in correct position from browser)
              setTimeout(() => {
                saveSelection()
              }, 0)
            }
          }}
          onKeyDown={(e) => {
            // Handle backspace/delete for media elements
            if (e.key === 'Backspace' || e.key === 'Delete') {
              const selection = window.getSelection()
              if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0)
                
                // Check if a media element is selected
                const mediaElements = ['IMG', 'VIDEO', 'AUDIO']
                let mediaNode: Node | null = null
                
                // Check if range contains a media element
                if (range.startContainer.nodeType === Node.ELEMENT_NODE) {
                  const startEl = range.startContainer as Element
                  if (mediaElements.includes(startEl.tagName)) {
                    mediaNode = startEl
                  }
                }
                
                // Check if common ancestor is a media element
                if (!mediaNode) {
                  const commonAncestor = range.commonAncestorContainer
                  if (commonAncestor.nodeType === Node.ELEMENT_NODE) {
                    const el = commonAncestor as Element
                    if (mediaElements.includes(el.tagName)) {
                      mediaNode = el
                    } else {
                      // Check if parent is media element
                      let parent = el.parentElement
                      while (parent && parent !== editorRef.current) {
                        if (mediaElements.includes(parent.tagName)) {
                          mediaNode = parent
                          break
                        }
                        parent = parent.parentElement
                      }
                    }
                  }
                }
                
                // Check if cursor is right before a media element
                if (!mediaNode && e.key === 'Backspace') {
                  const startNode = range.startContainer
                  let checkNode: Node | null = startNode
                  
                  if (startNode.nodeType === Node.TEXT_NODE && range.startOffset === 0) {
                    checkNode = startNode.previousSibling
                  } else if (startNode.nodeType === Node.ELEMENT_NODE) {
                    const el = startNode as Element
                    if (range.startOffset === 0) {
                      checkNode = el.previousSibling
                    }
                  }
                  
                  if (checkNode && checkNode.nodeType === Node.ELEMENT_NODE) {
                    const el = checkNode as Element
                    if (mediaElements.includes(el.tagName)) {
                      mediaNode = el
                    }
                  }
                }
                
                if (mediaNode) {
                  e.preventDefault()
                  e.stopPropagation()
                  const nextSibling = mediaNode.nextSibling
                  const parent = mediaNode.parentNode
                  if (parent) {
                    parent.removeChild(mediaNode)
                  }
                  
                  // Set cursor after deleted element or at end
                  setTimeout(() => {
                    const selection = window.getSelection()
                    if (selection && editorRef.current) {
                      const range = document.createRange()
                      if (nextSibling && editorRef.current.contains(nextSibling)) {
                        range.setStartBefore(nextSibling)
                      } else if (parent && editorRef.current.contains(parent)) {
                        range.setStartAfter(parent.lastChild || parent)
                      } else {
                        range.selectNodeContents(editorRef.current)
                        range.collapse(false)
                      }
                      range.collapse(true)
                      selection.removeAllRanges()
                      selection.addRange(range)
                      lastSelectionRef.current = range.cloneRange()
                    }
                    if (editorRef.current) {
                      onChange(editorRef.current.innerHTML)
                    }
                  }, 0)
                  return
                }
              }
            }
            // Save selection for normal typing
            saveSelection()
          }}
          onKeyUp={(e) => {
            // Restore selection after key up
            restoreSelection()
          }}
          onClick={(e) => {
            saveSelection()
            // Select media element on click
            const target = e.target as HTMLElement
            if (target.tagName === 'IMG' || target.tagName === 'VIDEO' || target.tagName === 'AUDIO') {
              const range = document.createRange()
              range.selectNode(target)
              const selection = window.getSelection()
              if (selection) {
                selection.removeAllRanges()
                selection.addRange(range)
                lastSelectionRef.current = range.cloneRange()
              }
            }
          }}
          onMouseUp={saveSelection}
          suppressContentEditableWarning
        />
      </div>

      {/* Media Dialog */}
      <Dialog open={showMediaDialog} onOpenChange={setShowMediaDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Insert {mediaType === 'image' ? 'Image' : mediaType === 'video' ? 'Video' : mediaType === 'audio' ? 'Audio' : 'File'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Upload File</Label>
              <Input
                type="file"
                accept={
                  mediaType === 'image' ? 'image/*' :
                  mediaType === 'video' ? 'video/*' :
                  mediaType === 'audio' ? 'audio/*' :
                  '*/*'
                }
                onChange={handleFileUpload}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Or Enter URL</Label>
              <Input
                type="url"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="https://..."
                className="mt-1"
              />
            </div>

            {(mediaType === 'video' || mediaType === 'audio') && (
              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center justify-between">
                  <Label>Autoplay</Label>
                  <input
                    type="checkbox"
                    checked={videoSettings.autoplay}
                    onChange={(e) => setVideoSettings({ ...videoSettings, autoplay: e.target.checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Loop</Label>
                  <input
                    type="checkbox"
                    checked={videoSettings.loop}
                    onChange={(e) => setVideoSettings({ ...videoSettings, loop: e.target.checked })}
                  />
                </div>
                {mediaType === 'video' && (
                  <div className="flex items-center justify-between">
                    <Label>Muted</Label>
                    <input
                      type="checkbox"
                      checked={videoSettings.muted}
                      onChange={(e) => setVideoSettings({ ...videoSettings, muted: e.target.checked })}
                    />
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <Label>Show Controls</Label>
                  <input
                    type="checkbox"
                    checked={videoSettings.controls}
                    onChange={(e) => setVideoSettings({ ...videoSettings, controls: e.target.checked })}
                  />
                </div>
                <div>
                  <Label>Playback Speed</Label>
                  <Select
                    value={videoSettings.speed}
                    onValueChange={(v) => setVideoSettings({ ...videoSettings, speed: v })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.5x">0.5x</SelectItem>
                      <SelectItem value="0.75x">0.75x</SelectItem>
                      <SelectItem value="1x">1x</SelectItem>
                      <SelectItem value="1.25x">1.25x</SelectItem>
                      <SelectItem value="1.5x">1.5x</SelectItem>
                      <SelectItem value="2x">2x</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowMediaDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleMediaInsert} disabled={!mediaUrl}>
                Insert
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
