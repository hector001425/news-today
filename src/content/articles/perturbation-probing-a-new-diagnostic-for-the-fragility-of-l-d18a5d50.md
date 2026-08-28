---
title: "Nuevo método detecta la fragilidad de los sistemas de seguridad en modelos de IA"
dek: "Investigadores de Unit 42 desarrollaron 'Perturbation Probing', una técnica diagnóstica para medir qué tan vulnerables son los filtros de seguridad de los LLM."
category: "investigacion"
source_name: "Unit 42"
source_url: "https://news.google.com/rss/articles/CBMid0FVX3lxTE1QOGphUExuZXdPNmVFUGVjVXJvXzU2Wk5lcm9HZ09SM2c0UnU3YXplRlVnT3lOU3NJUVdLTFl6TU9TU2hUdE1KSXp1aHlIakZCUXBhbnBldzhkQWtscXZ6c2FPNFlLdEMtSV94bDlkMV9tLVZpeFlZ?oc=5"
published_at: 2026-08-28T23:00:58.121Z
breaking: false
generated_by: "pipeline"
---

Investigadores del equipo de seguridad Unit 42 de Palo Alto Networks presentaron una nueva metodología llamada *Perturbation Probing*, diseñada para evaluar la robustez de los mecanismos de seguridad integrados en los modelos de lenguaje de gran escala (LLM). La técnica busca identificar con precisión qué tan fácil resulta eludir los controles que impiden a estos sistemas generar contenido dañino o peligroso.

El método consiste en introducir variaciones controladas —perturbaciones— en las instrucciones enviadas a un modelo para observar si sus respuestas cambian de manera significativa respecto a los límites de seguridad establecidos. Si pequeñas modificaciones en el texto de entrada logran alterar el comportamiento del sistema, eso indica una fragilidad estructural en sus capas de alineación y filtrado.

Según los autores, esta herramienta permite a equipos de seguridad y desarrolladores obtener un diagnóstico cuantitativo sobre la solidez de los guardarraíles de un LLM antes de desplegarlo en entornos productivos. El objetivo es anticipar vectores de ataque conocidos como *jailbreaks* y reducir la superficie de riesgo en aplicaciones críticas.

El trabajo se enmarca en un debate creciente dentro de la industria sobre la confiabilidad real de los sistemas de seguridad en modelos de IA comerciales, donde numerosas investigaciones han demostrado que incluso los filtros más sofisticados pueden ser vulnerados con técnicas relativamente sencillas de manipulación del *prompt*.
