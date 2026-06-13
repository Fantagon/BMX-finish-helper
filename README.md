# BMX Finish Helper v6.2

Jury-hulpmiddel voor BMX-finishpassages met:

- live camera-preview;
- finishlijn instellen met twee punten;
- live bewegingsdetectie rond de finishlijn;
- recente finishpassages;
- virtuele testpassage met willekeurig nummer;
- experimentele OCR voor nummerherkenning.

## Nieuw in v6.2

De OCR is verbeterd zonder extra OCR-zone-instelling:

- grotere crop rond de gedetecteerde beweging;
- extra crops rond het midden en onder-midden van het beeld;
- beeldvergroting voor OCR;
- contrastverhoging;
- threshold en inverted threshold pogingen;
- alleen cijfers worden geaccepteerd;
- OCR-status toont meer debuginformatie.

Als OCR niets bruikbaars vindt, blijft de passage `Onbekend`.
Als OCR iets mogelijk vindt, toont de app bijvoorbeeld `#501?` met badge `OCR`.
Het vraagteken betekent: onzeker, jury moet controleren.

## Testadvies OCR

Gebruik voor tests:

- grote cijfers;
- dikke zwarte stift;
- wit papier of duidelijk nummerbord;
- zo min mogelijk tegenlicht;
- nummer zo recht mogelijk naar de camera;
- telefoon stil op statief.

OCR blijft experimenteel. De live finishdetectie is leidend; OCR is alleen een hulpmiddel om het nummerlabel te raden.

## Upload naar Vercel

Upload de inhoud van deze map naar GitHub.

Belangrijk:

- upload geen `package-lock.json`;
- laat `.npmrc` staan;
- Vercel build command: `npm run build`;
- output directory: `dist`.


## v6.2 - OCR los testen

Nieuw in v6.2:

- Knop **Scan huidig beeld**.
- OCR kan nu los getest worden zonder dat er eerst een finishpassage nodig is.
- De scan probeert het volledige camerabeeld en meerdere midden-crops.
- De app toont OCR-debugtekst, zodat zichtbaar is wat OCR denkt te lezen.
- Als de scan een nummer vindt, wordt er een test-finishpassage met dat OCR-nummer toegevoegd.

Gebruik voor OCR-testen:

1. Zet **OCR proberen** aan.
2. Houd een groot, donker nummer stil en goed zichtbaar in beeld.
3. Druk **Scan huidig beeld**.
4. Kijk naar de OCR-status en open eventueel **OCR debugtekst**.

Let op: OCR blijft experimenteel. De live-detectie blijft leidend; OCR is alleen een hulpmiddel om een mogelijk nummerlabel toe te voegen.
