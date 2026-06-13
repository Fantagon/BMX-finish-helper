# BMX Finish Helper

Mobiele webapp als jury-hulpmiddel voor BMX-finishpassages.

Deze versie gebruikt geen OCR/nummerherkenning meer. De app bewaart bij elke gedetecteerde finishpassage een groot camerabeeld, zodat de jury direct kan terugkijken wat er gebeurde.

## Wat deze versie doet

- Live camera-preview op telefoon.
- Finishlijn instellen met twee punten.
- Finishlijn wordt opgeslagen in `localStorage`.
- Live bewegingsdetectie rond de finishlijn.
- Bij een finishpassage wordt direct een snapshot van het camerabeeld opgeslagen.
- Maximaal 8 terugkijkbeelden zichtbaar.
- Grote snapshots, zodat rijders/nummers beter handmatig te beoordelen zijn.
- Virtuele testpassage met willekeurig nummer.
- Instellingen voor gevoeligheid en detectiezone.
- Geen OCR-code of OCR-knoppen meer.

## Gebruik

1. Open de app op de telefoon via HTTPS.
2. Geef camera-toestemming.
3. Tik op **Finishlijn instellen**.
4. Tik punt A en punt B op de zichtbare finishlijn.
5. Zet **Live detectie** aan.
6. Laat rijders door de finishzone rijden.
7. Bekijk de snapshots onder **Terugkijkbeelden**.

## Belangrijk

De app is een jury-hulpmiddel, geen officiële fotofinish. Omdat de camera schuin van voren kan staan, kan perspectiefvertekening optreden. De snapshots helpen de jury terugkijken, maar de jury blijft leidend.

## Aanbevolen instellingen

Begin met:

- Gevoeligheid: Normaal
- Detectiezone: Normaal
- Debug: Aan tijdens testen, Uit tijdens gebruik

Als de app rijders mist: zet gevoeligheid hoger of detectiezone breder.
Als de app te snel valse meldingen geeft: zet gevoeligheid lager of detectiezone smaller.
