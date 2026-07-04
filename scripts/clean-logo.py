import os
from PIL import Image
from collections import deque

def make_background_transparent(image_path, output_path):
    img = Image.open(image_path).convert('RGBA')
    width, height = img.size
    data = img.load()
    
    # Cola para BFS
    queue = deque()
    visited = set()
    
    # Agregar las 4 esquinas al inicio del BFS
    corners = [(0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1)]
    for corner in corners:
        queue.append(corner)
        visited.add(corner)
        
    # BFS para encontrar todos los píxeles blancos/claros conectados al fondo exterior
    # El borde azul oscuro detendrá el avance hacia el interior del escudo.
    while queue:
        x, y = queue.popleft()
        r, g, b, a = data[x, y]
        
        # Si es un color claro/blanco (umbral alto en los canales RGB)
        # o si tiene cierta transparencia ya existente
        if (r > 200 and g > 200 and b > 200) or a == 0:
            # Hacer totalmente transparente
            data[x, y] = (r, g, b, 0)
            
            # Revisar vecinos de 4 direcciones
            for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                nx, ny = x + dx, y + dy
                if 0 <= nx < width and 0 <= ny < height and (nx, ny) not in visited:
                    visited.add((nx, ny))
                    queue.append((nx, ny))
                    
    img.save(output_path, 'PNG')
    print(f"Imagen procesada y guardada en: {output_path}")

# Ruta de las imágenes
adaptive_icon_path = 'assets/images/adaptive-icon.png'
icon_output_path = 'assets/images/icon.png'

if os.path.exists(adaptive_icon_path):
    # Generar la versión transparente en el adaptive-icon.png
    make_background_transparent(adaptive_icon_path, adaptive_icon_path)
    # Copiarla a icon.png para que la pantalla de login también tenga el escudo transparente
    make_background_transparent(adaptive_icon_path, icon_output_path)
else:
    print(f"Error: No se encontró {adaptive_icon_path}")
