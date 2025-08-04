```dataview
LIST WITHOUT ID "**[" + default(title, default(Title, file.name)) + "]("%20+%20file.name%20+%20")**" + ": " + default(description, default(Description, "No description"))
FROM "" 
WHERE (publish = true OR publish = "true" OR Publish = true OR Publish = "true")
  AND (
    contains(lower(string(default(type, Type))), "pattern") 
    OR (typeof(default(type, Type)) = "array" AND any(default(type, Type), (t) => contains(lower(string(t)), "pattern")))
  )
SORT file.name ASC
```