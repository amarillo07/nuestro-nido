/* Contenido fijo: cuestionario, sobres sugeridos y datos con fuente. */
const COLORS = ["coral", "mango", "mint", "sky", "pink", "grape"];

const CATS = [
  { id: "hablar", name: "Hablemos", emoji: "💬", c: "pink",
    intro: "Antes de los números, las expectativas. La mayoría de los pleitos de convivencia nacen de cosas que nunca se dijeron.",
    qs: [
      ["¿Por qué queremos vivir juntos y por qué ahora?", "Escriban cada quien su respuesta por separado y luego compárenla."],
      ["¿Qué significa para cada uno 'vivir juntos'? ¿Prueba, paso al matrimonio, proyecto de vida?", ""],
      ["¿Cómo resolvemos los desacuerdos? ¿Qué hacemos cuando uno necesita espacio?", "Acuerden una 'palabra de pausa' para retomar la plática más tarde."],
      ["¿Qué costumbres de nuestras casas queremos copiar y cuáles no?", ""],
      ["¿Cada cuánto vemos a nuestras familias y amigos? ¿Pueden quedarse a dormir?", ""],
      ["¿Mascotas, hijos o ninguno? ¿En qué plazo, más o menos?", "No tiene que ser definitivo, solo que las ideas no choquen."]
    ],
    fact: { big: "16.9%", eyebrow: "Dato INEGI", text: "de quienes nacieron entre 1998 y 2007 salió de casa antes de los 18 años, contra 31.1% de la generación 1961–1967. Independizarse más tarde es lo normal hoy.", src: "INEGI, EDER 2025" }
  },
  { id: "bote", name: "Bote común", emoji: "🫙", c: "mint",
    intro: "Su acuerdo: el 100% de lo que ganan los dos entra a una sola cuenta, y de ahí sale todo. Funciona muy bien si las reglas están claras desde el día uno.",
    qs: [
      ["¿Cuánto gana cada quien (neto) y en qué fechas cae cada pago?", "Saber las fechas ayuda a programar la renta y el ahorro automático."],
      ["¿Qué tipo de cuenta abrimos? ¿Mancomunada, solidaria o una con titular y cotitular?", "Mancomunada: se necesitan las dos firmas para ciertos movimientos. Solidaria: cualquiera puede operar. Pregunten las condiciones exactas al banco."],
      ["¿Las deudas que ya traía cada quien se pagan del bote?", "Las deudas previas siguen siendo de quien las contrajo, aunque acuerden pagarlas juntos. Anótenlo."],
      ["¿Cuánto es el 'gustito personal' de cada uno al mes, sin rendir cuentas?", "Sugerencia: la misma cantidad para los dos, aunque ganen distinto. Evita sentir que uno 'pide permiso'."],
      ["¿A partir de qué monto consultamos antes de una compra?", "Ejemplo: cualquier compra mayor a $2,000 se platica."],
      ["¿Qué pasa con aguinaldo, bonos y regalos en efectivo?", "Una opción: 50% a metas, 30% a la casa y 20% para gustitos."],
      ["¿Cada cuándo revisamos juntos el bote? ¿Quién lleva el registro?", "Una 'cita de dinero' de 20 minutos cada quincena funciona muy bien."]
    ],
    fact: { big: "10%", eyebrow: "Recomendación Condusef", text: "de los ingresos como mínimo para ir formando el fondo de emergencia, separándolo apenas llega el pago, no con lo que sobre.", src: "Condusef, 2026" }
  },
  { id: "vivienda", name: "Vivienda", emoji: "🏠", c: "sky",
    intro: "Dónde vivir define buena parte del presupuesto, los traslados y hasta el humor diario.",
    qs: [
      ["¿Rentar o comprar? ¿Por cuánto tiempo pensamos quedarnos?", "Para empezar, rentar da flexibilidad; comprar conviene más con estabilidad laboral y de pareja."],
      ["¿Qué zona nos queda bien para trabajo, familia y transporte?", "Calculen el tiempo de traslado real en hora pico."],
      ["¿Cuántas recámaras necesitamos? ¿Alguien hace home office?", ""],
      ["¿Amueblado o sin amueblar?", ""],
      ["¿Tenemos aval, póliza jurídica o depósito extra?", "Muchos arrendadores piden aval con propiedad o una póliza jurídica."],
      ["¿A nombre de quién va el contrato? ¿Lo firmamos los dos?", "Si firman ambos, los dos tienen derechos y obligaciones."]
    ],
    fact: { big: "$21,921", eyebrow: "Renta promedio CDMX", text: "al mes por un depa de 2 recámaras en junio de 2026, 9.6% más que un año antes. En Guadalajara, uno de 65 m² ronda $18,299.", src: "Inmuebles24 / El CEO, 2026" },
    tip: { title: "Regla práctica: renta + servicios ≈ 30–35% del bote", items: ["Ejemplo: si el bote recibe $38,000, la renta ideal ronda $11,000–12,000.", "Si pasa de 35%, el resto del presupuesto queda muy justo.", "Revisen el contrato: duración, aumento anual y quién paga reparaciones."] }
  },
  { id: "fondo", name: "Fondo de emergencia", emoji: "🛟", c: "coral",
    intro: "Su colchón para cuando algo sale mal: un despido, una enfermedad, una reparación urgente. No es para viajes ni ofertas.",
    qs: [
      ["¿Cuánto suman nuestros gastos básicos de un mes?", "Renta, comida, servicios, transporte y pagos mínimos de deudas. La pestaña Metas lo calcula con su bote."],
      ["¿Juntamos 3 o 6 meses? ¿Alguien trabaja por honorarios o sin prestaciones?", "Con un solo bote, si uno pierde el ingreso los dos lo sienten. Por eso conviene acercarse a 6 meses."],
      ["¿Dónde lo guardamos? Debe ser seguro y fácil de sacar.", "Una cuenta o inversión de disponibilidad diaria en una institución regulada."],
      ["¿Qué cuenta como 'emergencia' y qué no?", "Escríbanlo para no discutirlo en el momento."]
    ],
    fact: { big: "3 a 6", eyebrow: "Recomendación Condusef", text: "meses de gastos básicos en el fondo de emergencia.", src: "Condusef, 2026" }
  },
  { id: "mudanza", name: "Mudanza", emoji: "📦", c: "mango",
    intro: "El día uno cuesta más de lo que parece. Además del primer mes de renta, casi siempre hay depósito, muebles y mudanza.",
    qs: [
      ["¿Tenemos ahorrado el costo de arranque?", "Está como meta en la pestaña Metas; ajústenla a sus números."],
      ["¿Qué muebles y aparatos ya tiene cada quien?", "Hagan inventario antes de comprar nada."],
      ["¿Qué compramos nuevo, qué de segunda mano y qué puede esperar?", ""],
      ["¿Contratamos mudanza o pedimos ayuda a familia y amigos?", ""],
      ["¿Quién da de alta luz, agua, gas e internet, y a nombre de quién?", ""]
    ],
    tip: { title: "Costo de arranque típico (ejemplo con renta de $11,000)", items: ["Primer mes de renta: $11,000", "Depósito (usualmente 1 mes): $11,000", "Póliza jurídica, si la piden: pregunten el precio antes", "Cama, refri, estufa y básicos de cocina: desde ~$25,000 si todo es nuevo", "Mudanza y extras: ~$3,000 a $6,000", "Total aproximado: ~$50,000 a $55,000"] }
  },
  { id: "convivencia", name: "Convivencia", emoji: "🧹", c: "grape",
    intro: "Lavar trastes también es un tema de pareja. Repartir tareas a tiempo evita que una persona cargue con todo.",
    qs: [
      ["¿Cómo repartimos las tareas de la casa? ¿Fijas o rotativas?", "Una lista visible en el refri ayuda mucho al principio."],
      ["¿Qué tan ordenado y limpio le gusta a cada quien?", ""],
      ["Horarios: ¿quién madruga, quién se desvela, quién trabaja en casa?", ""],
      ["¿Cómo manejamos el tiempo a solas y los ratos con amigos?", ""],
      ["¿Hacemos una 'junta de casa' mensual para revisar qué funciona?", "15 minutos, con café, sin reclamos acumulados."]
    ]
  },
  { id: "legal", name: "Legal y seguros", emoji: "⚖️", c: "sky",
    intro: "No es romántico, pero protege a los dos. Esto es orientación general: las reglas cambian según el estado.",
    qs: [
      ["¿Sabemos qué es el concubinato en nuestro estado y cuándo aplica?", "En muchos estados se reconoce tras cierto tiempo viviendo juntos o al tener un hijo. Revisen el código civil de su estado o pregunten a un abogado."],
      ["Como todo va a un bote: ¿cómo dividimos lo que compremos si algún día nos separamos?", "Guarden tickets de compras grandes y anoten un acuerdo simple, aunque sea en esta app."],
      ["¿Leímos completo el contrato de arrendamiento antes de firmar?", "Revisen duración, penalización por salir antes, aumentos y depósito."],
      ["¿Tenemos seguro de gastos médicos o IMSS/ISSSTE cada quien?", ""],
      ["¿Nos registramos como beneficiarios (cuenta del bote, Afore, seguro de vida)?", ""],
      ["¿Vale la pena un seguro de hogar o de contenidos?", "Suelen ser baratos y cubren robo o daños."]
    ]
  },
  { id: "metas", name: "Metas y plan", emoji: "🎯", c: "pink",
    intro: "Convertir el sueño en fechas, para saber qué hacer este mes y no solo 'algún día'.",
    qs: [
      ["¿En qué fecha queremos mudarnos?", ""],
      ["¿Cuánto debemos ahorrar al mes para llegar?", "La pestaña Metas lo calcula sola con la fecha y el monto."],
      ["¿Qué otras metas tenemos (viaje, auto, estudios) y en qué orden?", "Primero fondo de emergencia y arranque; luego lo demás, para que no choquen."],
      ["¿Qué hacemos si algo se retrasa, como un cambio de trabajo?", ""],
      ["¿Cuándo volvemos a revisar este plan?", "Recomendación: cada 3 meses."]
    ]
  }
];

// Sobres sugeridos para un bote común (porcentaje del ingreso total). Suman 100.
const DEFAULT_BUCKETS = [
  { id: "casa",    name: "Renta y servicios",   emoji: "🏠", c: "sky",   pct: 34, kind: "basico" },
  { id: "super",   name: "Súper y comida",      emoji: "🛒", c: "mint",  pct: 17, kind: "basico" },
  { id: "trans",   name: "Transporte",          emoji: "🚌", c: "grape", pct: 7,  kind: "basico" },
  { id: "hogar",   name: "Cosas para la casa",  emoji: "🛋️", c: "mango", pct: 5,  kind: "gasto" },
  { id: "fondo",   name: "Fondo de emergencia", emoji: "🛟", c: "coral", pct: 10, kind: "ahorro" },
  { id: "metas",   name: "Metas y sueños",      emoji: "✈️", c: "sky",   pct: 10, kind: "ahorro" },
  { id: "juntos",  name: "Gustitos juntos",     emoji: "🍿", c: "pink",  pct: 7,  kind: "gasto" },
  { id: "gustoA",  name: "Gustito de {A}",      emoji: "💜", c: "grape", pct: 5,  kind: "gasto" },
  { id: "gustoB",  name: "Gustito de {B}",      emoji: "💗", c: "pink",  pct: 5,  kind: "gasto" }
];

const DEFAULT_GOALS = [
  { id: "g1", name: "Fondo de emergencia", emoji: "🛟", target: 75000, saved: 0, date: "", c: "coral" },
  { id: "g2", name: "Arranque de la mudanza", emoji: "📦", target: 55000, saved: 0, date: "", c: "mango" }
];

const SOURCES = [
  "INEGI, Encuesta Demográfica Retrospectiva (EDER) 2025, vía El Financiero (abr. 2026).",
  "Condusef, fondo de emergencia: 3 a 6 meses de gastos y 10% del ingreso, vía Fox Sports (sept. 2026) y El Imparcial (may. 2026).",
  "Index Inmuebles24 (jun. 2026), vía Xataka México y Posta.",
  "Rentas en Guadalajara, vía El CEO (2026)."
];
