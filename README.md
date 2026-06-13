# BMX Finish Helper v7 - snapshots bij finishpassages

Deze versie gebruikt de werkende live-detectie als basis en legt bij elke finishpassage automatisch een camerabeeld vast.

## Belangrijkste functies

- Live camerabeeld.
- Finishlijn met twee punten instellen.
- Bewegingsdetectie rond de finishlijn.
- Bij elke finishpassage wordt direct een snapshot van de camera opgeslagen.
- De app toont maximaal 8 terugkijkbeelden.
- Nieuwe passages komen onderaan; bij meer dan 8 verdwijnt de oudste.
- `Lijst wissen` wist de terugkijkbeelden.
- OCR blijft experimenteel en optioneel. Als OCR niets vindt, blijft de passage `Onbekend`.
- `Scan huidig beeld` heeft nu een time-out, zodat de app niet vast blijft hangen als OCR op de telefoon te lang duurt.

## Gebruik op de baan

1. Open de Vercel-link op je telefoon.
2. Zet de telefoon stil op een statief.
3. Stel de finishlijn in.
4. Laat `Live detectie` aan.
5. Laat een rider door de finishzone rijden.
6. Controleer onder `Terugkijkbeelden` het opgeslagen camerabeeld.

## Waarom snapshots?

Automatische OCR/nummerherkenning is bij BMX lastig door beweging, klein nummerbord, perspectief, motion blur en licht. Snapshots zijn betrouwbaarder als jury-hulpmiddel: de app bewaart het relevante moment, waarna de jury snel kan terugkijken.

## Beperkingen

Deze app is geen officiële fotofinish. De detectie is een hulpmiddel. De jury blijft leidend.
