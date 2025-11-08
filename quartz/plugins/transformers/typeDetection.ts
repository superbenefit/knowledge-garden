/**
 * Type Detection Transformer Plugin for Quartz
 * 
 * Detects content types and attaches type metadata to files for use by emitters.
 * Loads dynamic type definitions from content/tools/types/ at build time.
 * Does NOT handle layout selection - that's handled by category emitters.
 */

import { QuartzTransformerPlugin } from "../types"
import { detectType, getInheritanceChain, getTypeCategory, initializeWithLoadedTypes, hasDynamicTypes } from "../../types/typeRegistry"
import { loadTypeDefinitions } from "../../types/typeLoader"

export const TypeDetection: QuartzTransformerPlugin = () => {
  // Initialize dynamic types once at plugin creation
  let initPromise: Promise<void> | null = null

  const initializeDynamicTypes = async (contentDir: string) => {
    if (!hasDynamicTypes() && !initPromise) {
      initPromise = (async () => {
        try {
          console.log(`[TypeDetection] Loading dynamic type definitions from ${contentDir}/tools/types/...`)
          const loadedTypes = await loadTypeDefinitions(contentDir)

          if (Object.keys(loadedTypes.types).length > 0) {
            initializeWithLoadedTypes(loadedTypes)
            console.log('[TypeDetection] Dynamic type definitions loaded successfully')
          } else {
            console.log('[TypeDetection] No dynamic types found, using hardcoded fallback')
          }
        } catch (error) {
          console.warn('[TypeDetection] Failed to load dynamic types, using hardcoded fallback:', error)
        }
      })()
    }
    return initPromise
  }

  return {
    name: "TypeDetection",

    textTransform(_ctx, src) {
      return src
    },

    markdownPlugins() {
      return []
    },

    htmlPlugins(ctx) {
      return [
        () => {
          return async (tree, file) => {
            try {
              // Ensure dynamic types are loaded before processing
              await initializeDynamicTypes(ctx.argv.directory)
              
              const frontmatter = file.data.frontmatter
              const slug = file.data.slug
              
              const detectedType = detectType(frontmatter, slug || '')
              
              if (detectedType) {
                file.data.detectedType = detectedType
                file.data.typeInheritanceChain = getInheritanceChain(detectedType)
                file.data.typeCategory = getTypeCategory(detectedType)
                
                const typeClasses = []
                typeClasses.push(`type-${detectedType}`)
                typeClasses.push(`category-${file.data.typeCategory}`)
                
                const inheritanceChain = file.data.typeInheritanceChain
                if (Array.isArray(inheritanceChain)) {
                  inheritanceChain.forEach((ancestor) => {
                    typeClasses.push(`inherits-${ancestor}`)
                  })
                }
                
                file.data.typeClasses = typeClasses.join(' ')
                
                if (process.env.NODE_ENV === 'development') {
                  console.log(`[TypeDetection] ${slug}: ${detectedType} (${file.data.typeCategory}) [${hasDynamicTypes() ? 'dynamic' : 'hardcoded'}]`)
                }
              } else {
                // Safe fallback for files with no detected type
                file.data.detectedType = null
                file.data.typeCategory = 'note'
                file.data.typeInheritanceChain = ['note']
                file.data.typeClasses = 'category-note'
              }
              
            } catch (error) {
              console.warn(`[TypeDetection] Error processing file ${file.data.slug}:`, error)
              // Safe fallback to note type on any error
              file.data.detectedType = null
              file.data.typeCategory = 'note'
              file.data.typeInheritanceChain = ['note']
              file.data.typeClasses = 'category-note'
            }
            
            return tree
          }
        }
      ]
    },
  }
}