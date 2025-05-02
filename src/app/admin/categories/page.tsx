'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type Category = {
  id: string
  name: string
  description: string | null
  slug: string
}

// Slug generáló segédfüggvény
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function CategoryManagementPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [newCategory, setNewCategory] = useState({ 
    name: '', 
    description: '', 
    slug: '' 
  })

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/categories')
      if (!res.ok) throw new Error('Hiba történt a kategóriák betöltésekor')
      const data = await res.json()
      setCategories(data)
    } catch (error) {
      console.error('Hiba a kategóriák betöltésekor:', error)
      toast.error('Nem sikerült betölteni a kategóriákat')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  // Automatikus slug generálás a névből
  useEffect(() => {
    if (newCategory.name) {
      setNewCategory(prev => ({
        ...prev,
        slug: generateSlug(prev.name)
      }))
    }
  }, [newCategory.name])

  // Automatikus slug generálás szerkesztéskor
  useEffect(() => {
    if (editingCategory?.name) {
      setEditingCategory(prev => {
        if (!prev) return prev
        return {
          ...prev,
          slug: generateSlug(prev.name)
        }
      })
    }
  }, [editingCategory?.name])

  const handleCreateCategory = async () => {
    if (!newCategory.name.trim()) {
      toast.error('A kategória neve kötelező')
      return
    }

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategory)
      })

      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Hiba történt a kategória létrehozásakor')
      }
      
      toast.success('Kategória sikeresen létrehozva')
      setNewCategory({ name: '', description: '', slug: '' })
      await fetchCategories()
    } catch (error) {
      console.error('Hiba a kategória létrehozása közben:', error)
      toast.error(error instanceof Error ? error.message : 'Nem sikerült létrehozni a kategóriát')
    }
  }

  const handleUpdateCategory = async () => {
    if (!editingCategory) return

    try {
      const res = await fetch(`/api/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCategory)
      })

      if (!res.ok) throw new Error('Hiba történt a kategória frissítésekor')
      
      toast.success('Kategória sikeresen frissítve')
      setEditingCategory(null)
      await fetchCategories()
    } catch (error) {
      console.error('Hiba a kategória frissítése közben:', error)
      toast.error('Nem sikerült frissíteni a kategóriát')
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Biztosan törölni szeretnéd ezt a kategóriát?')) return

    try {
      const res = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Hiba történt a kategória törlésekor')
      }
      
      toast.success('Kategória sikeresen törölve')
      await fetchCategories()
    } catch (error: any) {
      console.error('Hiba a kategória törlése közben:', error)
      toast.error(error.message || 'Nem sikerült törölni a kategóriát')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center p-8">Betöltés...</div>
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-6 text-2xl font-bold">Kategóriakezelés</h1>
      
      <div className="mb-8 grid gap-6 md:grid-cols-2">
        {/* Új kategória létrehozása */}
        <Card>
          <CardHeader>
            <CardTitle>Új kategória létrehozása</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="new-name">Név</Label>
                <Input 
                  id="new-name"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                  placeholder="Kategória neve"
                />
              </div>
              <div>
                <Label htmlFor="new-slug">URL slug</Label>
                <Input 
                  id="new-slug"
                  value={newCategory.slug}
                  onChange={(e) => setNewCategory({...newCategory, slug: e.target.value})}
                  placeholder="kategoria-url"
                />
              </div>
              <div>
                <Label htmlFor="new-description">Leírás</Label>
                <Textarea 
                  id="new-description"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                  placeholder="Kategória leírása"
                />
              </div>
              <Button onClick={handleCreateCategory}>Létrehozás</Button>
            </div>
          </CardContent>
        </Card>

        {/* Kategória szerkesztése (csak ha van kiválasztott kategória) */}
        {editingCategory && (
          <Card>
            <CardHeader>
              <CardTitle>Kategória szerkesztése</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Név</Label>
                  <Input 
                    id="edit-name"
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-slug">URL slug</Label>
                  <Input 
                    id="edit-slug"
                    value={editingCategory.slug}
                    onChange={(e) => setEditingCategory({...editingCategory, slug: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Leírás</Label>
                  <Textarea 
                    id="edit-description"
                    value={editingCategory.description || ''}
                    onChange={(e) => setEditingCategory({...editingCategory, description: e.target.value})}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button onClick={handleUpdateCategory}>Mentés</Button>
                  <Button variant="outline" onClick={() => setEditingCategory(null)}>Mégsem</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Kategóriák listája */}
      <Card>
        <CardHeader>
          <CardTitle>Kategóriák</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p>Nincsenek még kategóriák.</p>
          ) : (
            <div className="space-y-4">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center justify-between rounded-md border p-4">
                  <div>
                    <h3 className="font-medium">{category.name}</h3>
                    <p className="text-xs text-gray-500">{category.slug}</p>
                    {category.description && <p className="text-sm text-gray-500">{category.description}</p>}
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setEditingCategory(category)}
                    >
                      Szerkesztés
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={() => handleDeleteCategory(category.id)}
                    >
                      Törlés
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 