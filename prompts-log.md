# Prompts Log i Analisi de Procés

Data: 2026-04-14
Projecte: prj-entrades-a23poldiabel

## 1) Registre de prompts utilitzats

| ID | Prompt | Objectiu | Resultat |
|---|---|---|---|
| P01 | "revisa que tingui tot aixo" (checklist Nuxt/Pinia/SSR/SSG/tests/socket/chart) | Auditar compliment de requisits | Detectats punts fets, parcials i pendents |
| P02 | "haz todo lo que no este hecho" | Implementar tot el que faltava | Implementades peces pendents al frontend |
| P03 | "entonces tiene todo lo siguiente?" | Verificar tancament final de requisits | Confirmacio punt a punt |
| P04 | Log docker compose (error de port 3000) | Diagnosticar perque no aixecava l'entorn | Causa trobada: conflicte de ports |
| P05 | "ahora mira uqe tot aixo estigui fet..." | Demanar evidencia documental del proces | Generat aquest document |

## 2) Errors detectats durant el proces

### E01 - Incompatibilitat de llibreria UI amb Nuxt 3
- Símptoma:
  - Avis en executar tests/build indicant incompatibilitat de la llibreria inicial triada.
- Impacte:
  - Risc de modul desactivat o comportament no estable.

### E02 - Fitxer transitori no desitjat (.nuxtrc)
- Símptoma:
  - Es va generar un fitxer temporal de setup durant la fase de proves.
- Impacte:
  - Soroll en canvis i possible confusio en el repo.

### E03 - Sortida de validacio massa gran
- Símptoma:
  - La sortida combinada de tests + build es va redirigir a fitxer temporal per mida.
- Impacte:
  - Calia validacio addicional manual del resultat final.

### E04 - Conflicte de ports Docker (3000 i 5173)
- Símptoma:
  - Error "port is already allocated" en aixecar sockets i frontend.
- Impacte:
  - Stack parcialment aixecat, sense serveis clau accessibles.

## 3) Com s'ha corregit cada error

### C01 - Correccio E01
- Accio:
  - Substitucio de la llibreria incompatible per PrimeVue compatible amb Nuxt 3.
  - Ajust de tema cap a paquet mantingut (@primeuix/themes).
- Verificacio:
  - Tests unitaris OK.
  - Build de produccio OK.

### C02 - Correccio E02
- Accio:
  - Eliminacio del fitxer .nuxtrc transitori de la proposta final.
- Verificacio:
  - Queden nomes canvis funcionals i de documentacio rellevants.

### C03 - Correccio E03
- Accio:
  - Lectura del fitxer de sortida gran i comprovacio explicita dels resultats.
- Verificacio:
  - Confirmat: 12/12 tests passant i build completat.

### C04 - Correccio E04
- Accio:
  - Identificacio de contenidors externs ocupant 3000 i 5173.
  - Aturada dels contenidors en conflicte.
  - Reinici del stack i recreacio del frontend per assegurar mapeig de port.
- Verificacio:
  - Services operatius: postgres, api, sockets, frontend.

## 4) Relacio problema <-> canvi de prompt o especificacio

| Problema | Relacio amb prompt/especificacio | Canvi aplicat |
|---|---|---|
| E01 UI incompatible | Prompt P02 exigia completar "llibreria de components" | Canvi de llibreria a PrimeVue compatible |
| E02 fitxer transitori | Prompt P03/P05 demana resultat net i verificable | Eliminat fitxer no essencial |
| E03 sortida gran | P03 demanava confirmacio final real | Validacio explicita del log redirigit |
| E04 ports ocupats | Prompt P04 (docker error real en execucio) | Resolucio operativa d'infra local |

## 5) Reflexio critica sobre resultat final i comportament de la IA

### Que ha funcionat be
- Bona capacitat d'auditoria inicial: va separar requisits fets/parcials/faltants.
- Implementacio orientada a objectiu: es van tancar els punts pendents amb canvis concrets.
- Verificacio final real: no es va donar per bo fins executar tests/build i comprovar logs.

### Limitacions observades
- Seleccio inicial de llibreria UI no alineada amb versio Nuxt (cost de re-treball).
- Aparicio de fitxers transitoris no desitjats durant setup.
- En entorns amb molts contenidors, els conflictes de ports poden quedar fora del context de codi.

### Millores recomanades per futures iteracions
- Afegir check de compatibilitat de paquets abans d'instal lar (Nuxt major, peer deps).
- Definir "Definition of Done" explicit amb:
  - no fitxers transitoris,
  - tests i build obligatoris,
  - comprovacio de ports lliures si s'usa Docker.
- Mantenir un registre de prompts i decisions des del principi per reduir retrac.

## Estat de compliment dels 5 punts demanats
- [x] He registrat tots els prompts en un prompts-log.md
- [x] He documentat errors detectats durant el proces
- [x] He explicat com he corregit cada error
- [x] He relacionat cada problema amb el canvi en el prompt o en la especificacio
- [x] He fet una reflexio critica sobre el resultat final i el comportament de la IA
