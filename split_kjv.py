import json
import os
from collections import defaultdict

# Path definitions
kjv_file_path = '/Users/joash/Olive/Olive_2-2/public/bibles/kjv/kjv_strongs.json'
output_dir = '/Users/joash/Olive/Olive_2-2/public/bibles/kjv_books'

# Create output directory if it doesn't exist
os.makedirs(output_dir, exist_ok=True)

# Load the KJV Strong's file
with open(kjv_file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Group verses by book and chapter
books = defaultdict(lambda: defaultdict(list))
for verse in data['verses']:
    book_name = verse['book_name']
    chapter = verse['chapter']
    # We'll keep only needed fields from the verse
    simplified_verse = {
        'verse': verse['verse'],
        'text': verse['text']
    }
    books[book_name][chapter].append(simplified_verse)

# Save each book into its own JSON file with the proper format
for book_name, chapters_dict in books.items():
    # Format the chapters array to match the expected format
    chapters_array = []
    for chapter_num in sorted(chapters_dict.keys()):
        chapter_obj = {
            'chapter': chapter_num,
            'verses': sorted(chapters_dict[chapter_num], key=lambda v: v['verse'])
        }
        chapters_array.append(chapter_obj)
    
    # Create the final book object
    book_obj = {
        'name': book_name,
        'chapters': chapters_array
    }
    
    # Convert book name to lowercase for filename (matching ASV pattern)
    filename = book_name.lower().replace(' ', '')
    filepath = os.path.join(output_dir, f"{filename}.json")
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(book_obj, f, ensure_ascii=False, indent=2)

print(f"Successfully split KJV into {len(books)} individual book files in {output_dir}") 