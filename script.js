document.addEventListener('DOMContentLoaded', () => {
    // Función para guardar los datos del formulario
    const saveFormData = () => {
        const formData = {};

        // Guardar inputs de texto
        document.querySelectorAll('.elegant-input').forEach(input => {
            formData[input.labels[0].textContent.trim().replace(':', '')] = input.value;
        });

        // Guardar porcentajes de la tabla
        document.querySelectorAll('.percentage-input').forEach(input => {
            formData[input.dataset.grade] = input.value;
        });

        // Guardar checkboxes y sus inputs de texto asociados
        document.querySelectorAll('.elegant-checkbox input[type="checkbox"]').forEach(checkbox => {
            const category = checkbox.dataset.category;
            const label = checkbox.dataset.label || checkbox.parentNode.textContent.trim().split('\n')[0].trim(); // Obtiene el texto principal de la label
            if (!formData[category]) {
                formData[category] = {};
            }
            formData[category][label] = checkbox.checked;

            // Si hay un input de texto asociado, guardar su valor también
            const inlineInput = checkbox.nextElementSibling && checkbox.nextElementSibling.nextElementSibling;
            if (inlineInput && inlineInput.classList.contains('inline-input')) {
                const inlineInputCategory = inlineInput.dataset.category;
                if (!formData[inlineInputCategory]) {
                    formData[inlineInputCategory] = {};
                }
                formData[inlineInputCategory][inlineInput.dataset.label || label + '-text'] = inlineInput.value;
            }
        });

        // Guardar radio buttons del período
        formData.semester = document.querySelector('input[name="semester"]:checked')?.value || '';

        localStorage.setItem('informeSemestralData', JSON.stringify(formData));
        alert('Datos guardados exitosamente!');
    };

    // Función para cargar los datos del formulario
    const loadFormData = () => {
        const savedData = localStorage.getItem('informeSemestralData');
        if (savedData) {
            const formData = JSON.parse(savedData);

            // Cargar inputs de texto
            document.querySelectorAll('.elegant-input').forEach(input => {
                const labelText = input.labels[0].textContent.trim().replace(':', '');
                if (formData[labelText] !== undefined) {
                    input.value = formData[labelText];
                }
            });

            // Cargar porcentajes de la tabla
            document.querySelectorAll('.percentage-input').forEach(input => {
                const gradeKey = input.dataset.grade;
                if (formData[gradeKey] !== undefined) {
                    input.value = formData[gradeKey];
                }
            });

            // Cargar checkboxes y sus inputs de texto asociados
            document.querySelectorAll('.elegant-checkbox input[type="checkbox"]').forEach(checkbox => {
                const category = checkbox.dataset.category;
                const label = checkbox.dataset.label || checkbox.parentNode.textContent.trim().split('\n')[0].trim();

                if (formData[category] && formData[category][label] !== undefined) {
                    checkbox.checked = formData[category][label];
                }

                const inlineInput = checkbox.nextElementSibling && checkbox.nextElementSibling.nextElementSibling;
                if (inlineInput && inlineInput.classList.contains('inline-input')) {
                    const inlineInputCategory = inlineInput.dataset.category;
                    const inlineInputLabel = inlineInput.dataset.label || label + '-text';
                    if (formData[inlineInputCategory] && formData[inlineInputCategory][inlineInputLabel] !== undefined) {
                        inlineInput.value = formData[inlineInputCategory][inlineInputLabel];
                    }
                }
            });

            // Cargar radio buttons del período
            if (formData.semester) {
                const radio = document.querySelector(`input[name="semester"][value="${formData.semester}"]`);
                if (radio) {
                    radio.checked = true;
                }
            }

            alert('Datos cargados exitosamente!');
        } else {
            alert('No hay datos guardados para cargar.');
        }
    };

    // Función para reiniciar el formulario
    const resetForm = () => {
        if (confirm('¿Estás seguro de que quieres reiniciar el formulario? Todos los datos se borrarán.')) {
            document.querySelectorAll('input[type="text"], input[type="number"], input[type="date"]').forEach(input => {
                input.value = '';
            });
            document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                checkbox.checked = false;
            });
            // Restablecer el valor predeterminado del semestre (si es necesario, aquí es 'II')
            document.querySelector('input[name="semester"][value="II"]').checked = true;
            localStorage.removeItem('informeSemestralData'); // Borra los datos guardados también
            alert('Formulario reiniciado.');
        }
    };

    // Función para imprimir/exportar a PDF
    const printToPdf = async () => {
        const documentContainer = document.getElementById('documentContainer');
        const printButton = document.getElementById('printBtn');
        const otherButtons = document.querySelectorAll('.action-buttons button:not(#printBtn)');

        // Ocultar botones no deseados para la impresión
        printButton.style.display = 'none';
        otherButtons.forEach(button => button.style.display = 'none');

        // Para evitar problemas de renderizado con elementos interactivos,
        // temporalmente deshabilitar inputs o hacerlos de solo lectura
        document.querySelectorAll('input, textarea, select').forEach(el => {
            el.setAttribute('data-original-read-only', el.readOnly);
            el.readOnly = true;
        });

        // Retraso para asegurar que los estilos de impresión se apliquen
        await new Promise(resolve => setTimeout(resolve, 100));

        try {
            const canvas = await html2canvas(documentContainer, {
                scale: 2, // Aumenta la escala para mejor resolución
                useCORS: true, // Habilita CORS si la imagen de encabezado está en un dominio diferente
                logging: true, // Habilita el log para depuración
            });

            const imgData = canvas.toDataURL('image/png');
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4'); // 'p' para retrato, 'mm' para milímetros, 'a4' tamaño

            const imgWidth = 210; // Ancho A4 en mm
            const pageHeight = 297; // Alto A4 en mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            // Añadir páginas si el contenido es más largo que una página
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save('Informe_Semestral_2025.pdf');

        } catch (error) {
            console.error('Error al generar el PDF:', error);
            alert('Hubo un error al generar el PDF. Por favor, inténtalo de nuevo.');
        } finally {
            // Restaurar la visibilidad de los botones
            printButton.style.display = 'flex';
            otherButtons.forEach(button => button.style.display = 'flex');

            // Restaurar el estado de solo lectura de los inputs
            document.querySelectorAll('input, textarea, select').forEach(el => {
                if (el.hasAttribute('data-original-read-only')) {
                    el.readOnly = el.getAttribute('data-original-read-only') === 'true';
                    el.removeAttribute('data-original-read-only');
                } else {
                    el.readOnly = false;
                }
            });
        }
    };


    // Asignar eventos a los botones
    document.getElementById('printBtn').addEventListener('click', printToPdf);
    document.getElementById('saveBtn').addEventListener('click', saveFormData);
    document.getElementById('loadBtn').addEventListener('click', loadFormData);
    document.getElementById('resetBtn').addEventListener('click', resetForm);
});