# 🤖 Simulador de Autómatas Finitos Determinísticos y Gramáticas Regulares

Un simulador web interactivo para autómatas finitos determinísticos y gramáticas regulares con visualización gráfica y reconocimiento de palabras.

## 📋 Características

### 🔧 Funcionalidades Principales
- **Carga de archivos**: Soporte para archivos de texto con formato específico
- **Autómatas Finitos**: Manejo de múltiples AFDs en un solo archivo
- **Gramáticas Regulares**: Soporte de carga y visualización básica
- **Visualización gráfica**: Representación interactiva usando D3.js
- **Reconocimiento de palabras**: Prueba en tiempo real con animación del camino
- **Interfaz moderna**: Diseño responsive con pestañas organizadas
- **Drag & Drop**: Carga de archivos arrastrando y soltando

### 🎯 Equivalencias Teóricas
- La lógica de conversión AFD → GR existe internamente para uso académico, pero la interfaz no expone esta función.
- **Validación**: El sistema valida la estructura de AFDs y gramáticas cargadas.

## 🚀 Cómo usar

### 1. Abrir la aplicación
Simplemente abre el archivo `index.html` en tu navegador web.
python -m http.server 8000 tambien para el programa y poder ejectuarlo en un servidor  local 

### 2. Cargar un archivo de autómatas
- Arrastra y suelta un archivo `.txt` en el área designada, o
- Haz clic en el área de carga para seleccionar un archivo

### 3. Explorar autómatas y gramáticas
- Usa las **pestañas** para alternar entre autómatas y gramáticas cargadas
- Selecciona un autómata del menú desplegable para visualizarlo
- La visualización se actualizará automáticamente

### 4. Probar palabras
- Ingresa una palabra en el campo de texto
- Haz clic en "Probar" o presiona Enter
- Observa la animación del camino de reconocimiento

### 5. Conversión (deshabilitada en la interfaz)
- La función de convertir AFD → Gramática Regular fue retirada de la UI.
- Nota: el método `FiniteAutomaton.prototype.toRegularGrammar()` permanece en el código para fines académicos y pruebas, pero no tiene controles en la página.

## 📄 Formato de archivo

Cada línea del archivo debe seguir el formato:
```
<IdInfo>:<NombreAutomata>:<Información1>;<Información2>;...;<InformaciónN>
```

### Códigos de IdInfo:

#### Para Autómatas Finitos Determinísticos:
- **1**: Conjunto de estados (separados por comas)
- **2**: Símbolos del alfabeto (separados por comas)
- **3**: Estado inicial
- **4**: Estados finales (separados por comas)
- **5**: Transiciones (formato: estado,símbolo,estado separadas por ';')

#### Para Gramáticas Regulares:
- **6**: Símbolos no terminales (separados por comas)
- **7**: Símbolos terminales (separados por comas)
- **8**: Símbolo inicial
- **9**: Producciones (formato: A->aB;A->a separadas por ';')

### Ejemplo de archivo:
```
# Autómata Finito Determinístico
1:AF04:q0,q1,q2
2:AF04:a,b
3:AF04:q0
4:AF04:q1
5:AF04:q0,a,q1;q0,b,q2;q1,a,q1;q1,b,q2;q2,a,q1;q2,b,q0



## 🎯 Ejemplos incluidos

El archivo `ejemplos_automatas.txt` contiene ejemplos de autómatas y gramáticas:

### Autómatas Finitos Determinísticos

#### AF04
- **Estados**: q0, q1, q2
- **Alfabeto**: a, b
- **Estado inicial**: q0
- **Estados finales**: q1
- **Descripción**: Reconoce palabras que terminan en 'a'

#### AF_Binario
- **Estados**: s0, s1, s2
- **Alfabeto**: 0, 1
- **Estado inicial**: s0
- **Estados finales**: s0
- **Descripción**: Reconoce números binarios divisibles por 3


## 🛠️ Tecnologías utilizadas

- **HTML5**: Estructura de la aplicación
- **CSS3**: Estilos modernos y responsive
- **JavaScript ES6+**: Lógica de la aplicación
- **D3.js**: Visualización de grafos
- **Drag & Drop API**: Carga de archivos intuitiva

## 📱 Características técnicas

### Visualización
- **Zoom y pan**: Navega por autómatas grandes
- **Arrastre de nodos**: Reorganiza la visualización
- **Animación de caminos**: Sigue el reconocimiento paso a paso
- **Estados especiales**: Diferenciación visual de estados iniciales y finales

### Validación
- **Verificación de formato**: Valida la estructura del archivo
- **Completitud**: Detecta transiciones faltantes
- **Determinismo**: Verifica que sea un AFD válido

### Interfaz
- **Responsive**: Funciona en desktop, tablet y móvil
- **Accesibilidad**: Navegación por teclado y lectores de pantalla
- **Notificaciones**: Feedback visual para todas las acciones

## 🔧 Estructura del proyecto

```
PoryectoAutomatas/
├── index.html              # Página principal
├── styles.css              # Estilos CSS
├── automata.js             # Lógica del autómata y parser
├── visualization.js        # Visualización con D3.js
├── main.js                 # Aplicación principal
├── ejemplos_automatas.txt  # Archivo de ejemplo
└── README.md              # Este archivo
```

## 🎨 Personalización

### Colores
Los colores se pueden modificar en las variables CSS en `styles.css`:
```css
:root {
    --primary-color: #2563eb;
    --success-color: #059669;
    --error-color: #dc2626;
    /* ... más variables */
}
```

### Visualización
Los parámetros de la visualización se pueden ajustar en `visualization.js`:
- Tamaño de nodos
- Fuerzas de simulación
- Colores de estados
- Velocidad de animación

## 🐛 Solución de problemas

### El archivo no se carga
- Verifica que sea un archivo `.txt`
- Revisa que el formato sea correcto
- Comprueba que no haya líneas vacías al final

### La visualización no aparece
- Asegúrate de tener conexión a internet (para D3.js)
- Verifica que el navegador soporte JavaScript ES6+
- Abre la consola del desarrollador para ver errores

### Las palabras no se reconocen
- Verifica que el autómata esté completo
- Comprueba que los símbolos estén en el alfabeto
- Revisa que las transiciones estén bien definidas

## 📚 Conceptos teóricos

### Autómata Finito Determinístico (AFD)
Un AFD es una 5-tupla (Q, Σ, δ, q₀, F) donde:
- **Q**: Conjunto finito de estados
- **Σ**: Alfabeto de entrada
- **δ**: Función de transición Q × Σ → Q
- **q₀**: Estado inicial
- **F**: Conjunto de estados finales

### Reconocimiento de palabras
Una palabra w es aceptada si existe un camino desde q₀ hasta un estado en F siguiendo las transiciones definidas por los símbolos de w.

## 👨‍💻 Desarrollo

Para modificar o extender la aplicación:

1. **Agregar nuevas características**: Modifica los archivos JavaScript
2. **Cambiar estilos**: Edita `styles.css`
3. **Añadir validaciones**: Extiende la clase `FiniteAutomaton`
4. **Mejorar visualización**: Modifica `AutomataVisualizer`

## 📄 Licencia

Este proyecto fue desarrollado para fines educativos como parte del curso de Teoría de Autómatas.
