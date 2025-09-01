import os

def get_all_files(directory_path, output_file):
    # Open file in write mode
    with open(output_file, 'w', encoding='utf-8') as f:
        # Walk through all directories and files
        for root, dirs, files in os.walk(directory_path):
            # Write directory path as a section header
            f.write(f"\nDirectory: {root}\n")
            f.write("-" * 50 + "\n")
            
            # Write all files with their extensions
            for index, file in enumerate(files, 1):
                name, ext = os.path.splitext(file)
                f.write(f"{index}. File: {name} | Extension: {ext}\n")

# Specify your directory path here
directory_path = "."  # Current directory, change this to your desired path
output_file = "file_inventory.txt"

# Run the function
get_all_files(directory_path, output_file)
print(f"File inventory has been saved to {output_file}")