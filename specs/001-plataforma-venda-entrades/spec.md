# Feature Specification: Plataforma de Venda d'Entrades en Temps Real

**Feature Branch**: `001-plataforma-venda-entrades`  
**Created**: 2026-03-24  
**Status**: Draft  
**Input**: Projecte complet de plataforma de venda d'entrades per a esdeveniments d'alta demanda amb temps real

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visualitzar Esdeveniment i Selecció de Seients (Priority: P1)

L'usuari pot accedir a la pàgina d'un esdeveniment i visualitzar tota la informació relevant així com el plànol interactiu de seients.

**Why this priority**: Aquesta és la funcionalitat bàsica sense la qual el sistema no té sentit. Tots els altres fluxos depenen de poder visualitzar i seleccionar seients.

**Independent Test**: L'usuari pot obrir la pàgina de l'esdeveniment, veure la informació (nom, data, recinte, preus) i el mapa de seients, on cada seient mostra el seu estat actual.

**Acceptance Scenarios**:

1. **Given** L'usuari entra a la pàgina de l'esdeveniment, **When** Carrega la pàgina, **Then** Es mostra el nom, data/hora, recinte, descripció i preus per tipus d'entrada
2. **Given** L'usuari visualitza el mapa de seients, **When** Cada seient mostra el seu estat (disponible/reservat/seleccionat/venut), **Then** Els colors representen correctament cada estat
3. **Given** Un altre usuari reserva un seient, **When** El servidor rep la notificació de reserva, **Then** Tots els clients veuen actualitzat l'estat del seient en temps real

---

### User Story 2 - Reserva Temporal de Seients (Priority: P1)

L'usuari pot seleccionar seients per fer una reserva temporal mentre completa el procés de compra.

**Why this priority**: Permet a l'usuari bloquejar seients sense comprar immediatament, donant-li temps per completar les dades personals.

**Independent Test**: L'usuari selecciona fins a N seients, rep confirmació del servidor, i disposa d'un temporitzador visible per completar la compra.

**Acceptance Scenarios**:

1. **Given** L'usuari fa clic a un seient disponible, **When** Envia petició de reserva al servidor, **Then** El servidor valida i accepta la reserva, el seient passa a estat "seleccionat per mi" amb temporitzador actiu
2. **Given** L'usuari arriba al límit de seients permitits, **When** Intenta seleccionar un seient addicional, **Then** El sistema mostra un missatge informant del límit
3. **Given** El temporitzador de reserva expira (3-5 minuts), **When** El temps s'esgota, **Then** Els seients tornen a estat disponible automàticament per a altres usuaris
4. **Given** Dos usuaris intenten reservar el mateix seient simultàniament, **When** Les peticions arriben gairebé simultàniament al servidor, **Then** Només un ho aconsegueix, l'altre rep missatge d'error immediat

---

### User Story 3 - Procés de Compra (Priority: P1)

L'usuari pot completar la compra de les entrades seleccionades rebent confirmació i les seves entrades.

**Why this priority**: Objectiu final del sistema: vendre entrades. Sense això, la resta de funcionalitats no tenen valor.

**Independent Test**: L'usuari amb seients reservats pot omplir les seves dades, confirmar la compra i rebre les entrades.

**Acceptance Scenarios**:

1. **Given** L'usuari té seients reservats amb temporitzador actiu, **When** Omple les dades personals i confirma la compra, **Then** El servidor valida la propietat de la reserva, Processa el pagament (simulat), Canvia els seients a estat "venut", Emet les entrades
2. **Given** L'usuari intenta comprar seients que no té reservats, **When** Envia petició de compra amb seients no reservats, **Then** El servidor rebutja la compra amb missatge d'error
3. **Given** La compra es confirma correctament, **When** El procés acaba, **Then** Tots els clients reben actualització en temps real dels seients venuts

---

### User Story 4 - Consulta d'Entrades Comprades (Priority: P2)

L'usuari pot consultar les seves entrades adquirides anteriorment.

**Why this priority**: Funcionalitat important per a l'usuari que necessita accedir a les seves entrades posteriorment.

**Independent Test**: L'usuari pot cercar les seves entrades per correu electrònic i visualitzar el detall de l'esdeveniment i seients adquirits.

**Acceptance Scenarios**:

1. **Given** L'usuari introdueix el seu correu electrònic, **When** Clica a cercar entrades, **Then** El sistema mostra totes les entrades associades a aquest correu
2. **Given** L'usuari selecciona una entrada, **When** Visualitza el detall, **Then** Es mostra informació de l'esdeveniment, seients i codi d'entrada

---

### User Story 5 - Panell d'Administració: Gestió d'Esdeveniments (Priority: P2)

L'administrador pot crear i editar esdeveniments amb les seves zones, categories i preus.

**Why this priority**: Necessari perquè l'administrador pugui configurar els esdeveniments que es vendran.

**Independent Test**: L'administrador pot crear un nou esdeveniment definint aforament, plànol de seients, categories i preus.

**Acceptance Scenarios**:

1. **Given** L'administrador accedeix al panell, **When** Crea un nou esdeveniment, **Then** Pot definir: nom, data/hora, recinte, aforament total, zones/seients, categories de preus
2. **Given** L'administrador edita un esdeveniment existent, **When** Modifica alguna propietat, **Then** Els canvis es reflecteixen per als usuaris

---

### User Story 6 - Panell d'Administració: Monitoratge en Temps Real (Priority: P2)

L'administrador pot monitoritzar l'estat de l'esdeveniment en temps real.

**Why this priority**: Permet a l'administrador veure l'activitat i estat actual de la venda d'entrades.

**Independent Test**: L'administrador veu un panell amb estadístiques actualitzades en temps real.

**Acceptance Scenarios**:

1. **Given** L'administrador està al panell, **When** Hi ha usuaris actius, **Then** Es mostra nombre d'usuaris connectats, nombre de reserves actives, nombre de compres confirmades
2. **Given** Els usuaris compren o reserven seients, **When** Els estats canvien, **Then** El panell mostra seients disponibles/reservats/venuts en temps real

---

### User Story 7 - Panell d'Administració: Informes i Estadístiques (Priority: P3)

L'administrador pot consultar informes de vendes i ocupació.

**Why this priority**: Funcionalitat de negoci per fer seguiment de rendiment de l'esdeveniment.

**Independent Test**: L'administrador pot veure diferents mètriques de vendes.

**Acceptance Scenarios**:

1. **Given** L'administrador consulta informes, **When** Accedeix a la secció d'informes, **Then** Pot veure: recaptació per tipus d'entrada, recaptació total, percentatge d'ocupació, evolució temporal de vendes/reserves

---

### Edge Cases

- Quan un usuari perd la connexió i recarrega la pàgina: el sistema ha de gestionar la reconnexió i restaurar l'estat (o avisar si les reserves han expirat)
- Quan el servidor cau o es reinicia: les reserves actives es perden i els seients tornen a disponible
- Abús de reserves: spam de peticions de reserva des d'un mateix usuari ha de ser detectat i limitat
- Sessions paral·leles: un usuari amb múltiples pestanyes no pot reservar més del límit establert

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema ha de permetre visualitzar un esdeveniment amb la seva informació completa (nom, data/hora, recinte, descripció, preus per tipus)
- **FR-002**: El sistema ha de mostrar un mapa de seients on cada seient tingui un estat visible i actualitzat en temps real (disponible, reservat, seleccionat per mi, venut)
- **FR-003**: El sistema ha de permetre a l'usuari seleccionar fins a N seients (límit definit al sistema) per fer una reserva temporal
- **FR-004**: El sistema ha de gestionar la reserva des del servidor: el client mai pot forçar l'estat d'un seient
- **FR-005**: El sistema ha d'iniciar un temporitzador visible (3-5 minuts) quan es fa una reserva temporal
- **FR-006**: El sistema ha d'alliberar automàticament els seients quan expira el temporitzador de reserva
- **FR-007**: El sistema ha de permetre completar el procés de compra amb les dades personals de l'usuari
- **FR-008**: El sistema ha de validar al servidor que l'usuari és propietari de les reserves abans de confirmar la compra
- **FR-009**: El sistema ha de notificar a tots els clients connectats quan un seient canvia d'estat
- **FR-010**: El sistema ha de permetre consultar les entrades comprades mitjançant correu electrònic
- **FR-011**: L'administrador ha de poder crear i editar esdeveniments (aforament, plànol, categories, preus)
- **FR-012**: L'administrador ha de veure un panell en temps real amb: seients per estat, usuaris connectats, reserves actives, compres confirmades
- **FR-013**: L'administrador ha de poder consultar informes: recaptació per tipus, total, percentatge ocupació, evolució temporal
- **FR-014**: El sistema ha de gestionar la concurrència: quan dos usuaris intenten reservar el mateix seient, només un ho aconsegueix i l'altre rep un missatge d'error immediat
- **FR-015**: El sistema ha de protegir contra abús: limitació de reserves per usuari i gestió de spam

### Key Entities

- **Esdeveniment**: Representa un espectacle/concert/partit. Atributs: nom, data, hora, recinte, descripció, categories de preus
- **Seient**: Representa una posició individual a l'esdeveniment. Atributs: número, fila, zona, estat (disponible/reservat/seleccionat/venut)
- **Reserva**: Representa una reserva temporal. Atributs: usuari, seients reservats, data/hora d'inici, temps restant
- **Entrada**: Representa una entrada adquirida. Atributs: codi única, esdeveniment, seients, comprador, data de compra
- **Usuari**: Persona que compra o administra. Atributs: nom, correu electrònic, rols (comprador/administrador)
- **Zona**: Àrea del recinte amb preu específic. Atributs: nom, preu, seients associats

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Els usuaris poden completar el procés de reserva i compra en menys de 5 minuts
- **SC-002**: El sistema suporta 1000 usuaris simultanis sense degradació significativa del servei
- **SC-003**: Quan dos usuaris competeixen pel mateix seient, el temps de resposta d'error per al perdedor és inferior a 500ms
- **SC-004**: El 95% dels canvis d'estat de seients es propaguen a tots els clients connectats en menys d'1 segon
- **SC-005**: El sistema mai ven el mateix seient a dos usuaris diferents (coherència 100%)
- **SC-006**: Els administradors poden veure estadístiques en temps real amb actualització inferior a 2 segons
