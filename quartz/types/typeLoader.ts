/**
 * Type Loader for SuperBenefit Knowledge Garden
 *
 * Loads type definitions dynamically from content/tools/types/ directory
 * at build time, parsing frontmatter to extract type information.
 *
 * This replaces hardcoded type definitions with dynamic loading from
 * the Obsidian vault, enabling automatic recognition of new types.
 */

import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { TypeDefinition } from './typeRegistry'

/**
 * Raw type definition from Obsidian Metadata Menu
 */
interface ObsidianTypeDefinition {
  limit?: number
  mapWithTag?: boolean
  icon?: string
  tagNames?: string[]
  filesPaths?: string[]
  bookmarksGroups?: string[]
  excludes?: string[]
  extends?: string
  savedViews?: any[]
  favoriteView?: string
  fieldsOrder?: string[]
  version?: string
  fields?: any[]
}

/**
 * Result of loading type definitions
 */
export interface LoadedTypeDefinitions {
  types: Record<string, TypeDefinition>
  categories: Record<string, string>  // type -> category mapping
  inheritance: Record<string, string[]>  // type -> chain mapping
}

/**
 * Load type definitions from content/tools/types/ directory
 * @param contentDir - Path to content directory (default: 'content')
 */
export async function loadTypeDefinitions(contentDir: string = 'content'): Promise<LoadedTypeDefinitions> {
  const typesDir = path.join(contentDir, 'tools', 'types')
  
  if (!fs.existsSync(typesDir)) {
    console.warn(`[TypeLoader] Types directory not found: ${typesDir}`)
    return { types: {}, categories: {}, inheritance: {} }
  }

  const types: Record<string, TypeDefinition> = {}
  const inheritance: Record<string, string[]> = {}
  const categories: Record<string, string> = {}
  
  try {
    // Single-pass processing: Load, parse, and convert all type definitions
    const files = fs.readdirSync(typesDir).filter(f => f.endsWith('.md'))
    
    for (const file of files) {
      const filePath = path.join(typesDir, file)
      const typeName = path.basename(file, '.md')
      
      // Skip non-type files
      if (typeName === 'readme' || typeName === 'index') {
        continue
      }
      
      try {
        const content = fs.readFileSync(filePath, 'utf8')
        const { data: frontmatter } = matter(content)
        
        // Convert raw type directly to TypeDefinition format
        const rawType = frontmatter as ObsidianTypeDefinition
        types[typeName] = {
          name: typeName,
          extends: rawType.extends || undefined,
          filesPaths: rawType.filesPaths || [],
          icon: rawType.icon || 'file',
          tagNames: rawType.tagNames || [],
          mapWithTag: rawType.mapWithTag || false,
          limit: rawType.limit || 20,
          fields: rawType.fields || []
        }
        
        console.log(`[TypeLoader] Loaded type definition: ${typeName}`)
      } catch (error) {
        console.warn(`[TypeLoader] Failed to parse ${file}:`, error)
      }
    }
    
    // Build inheritance chains and categories for all loaded types
    for (const typeName of Object.keys(types)) {
      inheritance[typeName] = buildInheritanceChain(typeName, types)
      categories[typeName] = determineCategory(typeName, types)
    }
    
    console.log(`[TypeLoader] Successfully loaded ${Object.keys(types).length} type definitions`)
    console.log(`[TypeLoader] Categories:`, categories)
    
    return { types, categories, inheritance }
    
  } catch (error) {
    console.error(`[TypeLoader] Error loading type definitions:`, error)
    return { types: {}, categories: {}, inheritance: {} }
  }
}

/**
 * Build inheritance chain for a type
 */
function buildInheritanceChain(typeName: string, types: Record<string, TypeDefinition>): string[] {
  const chain: string[] = [typeName]
  const visited = new Set<string>()
  
  let currentType = types[typeName]
  
  while (currentType?.extends && !visited.has(currentType.extends)) {
    visited.add(currentType.extends)
    chain.push(currentType.extends)
    currentType = types[currentType.extends]
    
    if (!currentType) {
      console.warn(`[TypeLoader] Missing parent type: ${chain[chain.length - 1]} for ${typeName}`)
      break
    }
  }
  
  return chain.reverse() // Base type first
}

/**
 * Determine category for a type based on inheritance
 */
function determineCategory(typeName: string, types: Record<string, TypeDefinition>): string {
  const type = types[typeName]
  if (!type) return 'note'
  
  // Walk up inheritance chain to find category
  let currentTypeName = typeName
  const visited = new Set<string>()
  
  while (currentTypeName && !visited.has(currentTypeName)) {
    visited.add(currentTypeName)
    
    const currentType = types[currentTypeName]
    if (!currentType) break
    
    // Check if this is a known category type
    if (currentTypeName === 'artifact') return 'artifact'
    if (currentTypeName === 'reference') return 'reference'
    if (currentTypeName === 'note') return 'note'
    
    // Move to parent
    currentTypeName = currentType.extends || ''
  }
  
  // Default fallback
  return 'note'
}

/**
 * Get category for a specific type
 */
export function getCategoryForType(type: string, definitions: LoadedTypeDefinitions): string {
  return definitions.categories[type] || 'note'
}

/**
 * Get all types that belong to a specific category
 */
export function getTypesForCategory(category: string, definitions: LoadedTypeDefinitions): string[] {
  return Object.keys(definitions.categories).filter(
    type => definitions.categories[type] === category
  )
}

/**
 * Get inheritance chain for a type
 */
export function getInheritanceChain(type: string, definitions: LoadedTypeDefinitions): string[] {
  return definitions.inheritance[type] || [type]
}

/**
 * Check if type definitions are available
 */
export function hasTypeDefinitions(definitions: LoadedTypeDefinitions): boolean {
  return Object.keys(definitions.types).length > 0
}