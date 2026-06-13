# BMX Finish Helper

BMX Finish Helper is een eenvoudige webapp voor op een telefoon. De app toont live camera-preview, laat de gebruiker een finishlijn met twee punten instellen, en kan in testmodus gesimuleerde riders over de finishlijn laten bewegen.

De app is een jury-hulpmiddel, geen officiële fotofinish.

## Wat zit erin?

- Live camera-preview
- Finishlijn instellen met punt A en punt B
- Finishlijn zichtbaar over het camerabeeld
- Finishlijn opslaan in `localStorage`
- Automatisch hergebruiken van de opgeslagen finishlijn
- Testmodus met gesimuleerde riders
- Detectie van kruising via een 2D-finishlijn
- Lijst met `Recente finishpassages`
- Finish-events blijven 15 seconden zichtbaar
- Maximaal 8 zichtbare items
- Duplicaten binnen 3 seconden worden genegeerd

## Belangrijke beperking

Omdat de camera schuin van voren staat, kan perspectiefvertekening optreden. Een simpele 2D-lijn in het camerabeeld is een benadering.

Voor betere nauwkeurigheid is later nodig:

- calibratie van perspectief / homography;
- detectie van voorwiel of voorste punt van de fiets;
- betere tracking van rijders over meerdere frames;
- hogere framerate;
- goede plaatsing van de telefoon;
- voldoende licht;
- korte sluitertijd / weinig motion blur.

Voor versie 1 is het doel: de app helpt de jury met een vermoedelijke volgorde, maar jurycontrole blijft leidend.

## Online draaien zonder computer

De makkelijkste route is GitHub + Vercel:

1. Maak een GitHub repository, bijvoorbeeld `bmx-finish-helper`.
2. Upload de inhoud van deze projectmap naar GitHub.
3. Maak een Vercel-account of log in met GitHub.
4. Kies in Vercel: Add New Project.
5. Selecteer de GitHub repository.
6. Gebruik deze instellingen:

```txt
Framework: Vite
Install command: npm install
Build command: npm run build
Output directory: dist
```

7. Klik Deploy.
8. Open de HTTPS-link op je telefoon.

## Lokaal draaien met computer

```bash
npm install
npm run dev
```

Build testen:

```bash
npm run build
```

## Gebruik op telefoon

1. Open de Vercel HTTPS-link.
2. Geef camera-toestemming.
3. Tik op `Finishlijn instellen`.
4. Tik punt A op de zichtbare finishlijn.
5. Tik punt B op de zichtbare finishlijn.
6. Zet testmodus aan.
7. Tik `Simuleer rider over finishlijn`.
8. Als de gesimuleerde rider de lijn kruist, verschijnt een item onder `Recente finishpassages`.

## Echte AI/OCR later aansluiten

Deze app bevat nu testmodus en geometrie/trackingstructuur. Een echte AI/OCR-module moet later `RiderDetection[]` aanleveren:

```ts
export type RiderDetection = {
  id: string;
  number?: string;
  confidence?: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  timestamp: number;
};
```

Alle coördinaten zijn genormaliseerd van 0 tot 1.


## Versie 2: handmatig testnummer

Deze versie bevat een veld **Testnummer**. Vul hier bijvoorbeeld `501` in.

In testmodus gebruiken de knoppen daarna dit nummer:

- **Simuleer #501 over finishlijn** laat een gesimuleerde rider met dat nummer over de finishlijn bewegen.
- **Voeg finish-event toe met testnummer** voegt direct een finishpassage met dat nummer toe.

Belangrijk: de app herkent het nummerbord nog niet automatisch. Dit veld is bedoeld om de finishlijnlogica en juryweergave alvast realistischer op de baan te testen.
