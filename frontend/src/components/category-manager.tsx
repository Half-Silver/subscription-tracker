import { useState } from "react";
import { Plus, Trash2, Tag } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { categories } from "@/lib/subscriptions";
import { cn } from "@/lib/utils";

export function CategoryManager() {
  const [items, setItems] = useState(categories);
  const [newCategory, setNewCategory] = useState("");

  const addCategory = () => {
    const trimmed = newCategory.trim();
    if (trimmed && !items.includes(trimmed)) {
      setItems([...items, trimmed]);
      setNewCategory("");
    }
  };

  const removeCategory = (category: string) => {
    setItems(items.filter((c) => c !== category));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5 text-primary" />
          Categories
        </CardTitle>
        <CardDescription>Manage categories the AI uses to classify subscriptions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {items.map((category) => (
            <Badge key={category} variant="secondary" className="flex items-center gap-1 px-2.5 py-1">
              {category}
              <button
                onClick={() => removeCategory(category)}
                className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                aria-label={`Remove ${category}`}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="New category"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addCategory();
            }}
            className="max-w-xs"
          />
          <Button onClick={addCategory} size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Default categories are based on common subscription types. You can add custom categories for more accurate AI classification.
        </p>
      </CardContent>
    </Card>
  );
}
