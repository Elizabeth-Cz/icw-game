import { StaticImageData } from 'next/image';

// Import all character images
import AlexImage from '../assets/Alex.png';
import AnnaImage from '../assets/Anna.png';
import BrianImage from '../assets/Brian.png';
import DavidImage from '../assets/David.png';
import DiogoImage from '../assets/Diogo.png';
import DriesImage from '../assets/Dries.png';
import ElouanImage from '../assets/Elouan.png';
import FrankImage from '../assets/Frank.png';
import GiriImage from '../assets/Giri.png';
import HiteshImage from '../assets/Hitesh.png';
import IvanImage from '../assets/Ivan.png';
import IvanaImage from '../assets/Ivana.png';
import JeeshanImage from '../assets/Jeeshan.png';
import JesseImage from '../assets/Jesse.png';
import JosImage from '../assets/Jos.png';
import KarlImage from '../assets/Karl.png';
import KevinImage from '../assets/Kevin.png';
import LinhImage from '../assets/Linh.png';
import LizImage from '../assets/Liz.png';
import LouiseImage from '../assets/Louise.png';
import LucImage from '../assets/Luc.png';
import MariaImage from '../assets/Maria.png';
import MichielImage from '../assets/Michiel.png';
import MikeImage from '../assets/Mike.png';
import NickImage from '../assets/Nick.png';
import RalphImage from '../assets/Ralph.png';
import SidImage from '../assets/Sid.png';
import TarekImage from '../assets/Tarek.png';
import TissamImage from '../assets/Tissam.png';
import TonnyImage from '../assets/Tonny.png';
import WalaImage from '../assets/Wala.png';
import KennyImage from '../assets/Kenny.png';

// Define team types
export type TeamType = 'rocket' | 'management' | 'one' | 'product' | 'amigo';

// Define character image data structure
export type CharacterImageData = {
  image: StaticImageData;
  team: TeamType;
};

// Team background color mapping
export const teamBgClass: Record<TeamType, string> = {
  rocket: "bg-[#237658]",
  management: "bg-[#D0B334]",
  one: "bg-[#D34F34]",
  product: "bg-[#4f7ec1]",
  amigo: "bg-[#0390A1]"
};

// Color families from page.tsx
export const colorFamilies = [
  // Greens
  ["#237658", "#1A8A70", "#2C9678"],
  // Yellows/Golds
  ["#D0B334", "#E6C13D", "#C9A428"],
  // Reds/Oranges
  ["#D34F34", "#E05B41", "#C64025"],
  // Pinks/Purples
  ["#D084A9", "#C46B97", "#B85F8A"],
  // Blues
  ["#27528F", "#3468B0", "#1E4578"],
  // Teals/Cyans
  ["#0390A1", "#0AACBF", "#007D8C"]
];

// Map of team colors to their complementary color families
export const teamComplementaryColors: Record<TeamType, string[]> = {
  rocket: colorFamilies[3],      // Rocket (Green #237658) -> Pinks/Purples (opposite)
  management: colorFamilies[5],  // Management (Gold #D0B334) -> Teals/Cyans (opposite)
  one: colorFamilies[4],         // One (Red/Orange #D34F34) -> Blues (opposite)
  product: colorFamilies[2],     // Product (Blue #4f7ec1) -> Reds/Oranges (opposite)
  amigo: colorFamilies[1]        // Amigo (Teal #0390A1) -> Yellows/Golds (opposite)
};

// Map of character names to their PNG images and teams
// Organized to ensure no two characters from the same team are adjacent in the frame
// and to distribute team colors evenly around the entire grid
export const characterData: Record<string, CharacterImageData> = {
  'Alex': { image: AlexImage, team: 'rocket' },
  'Anna': { image: AnnaImage, team: 'management' },
  'Elouan': { image: ElouanImage, team: 'one' },
  'Ivana': { image: IvanaImage, team: 'product' },
  'David': { image: DavidImage, team: 'amigo' },
  'Diogo': { image: DiogoImage, team: 'rocket' },
  'Brian': { image: BrianImage, team: 'management' },
  'Frank': { image: FrankImage, team: 'one' },
  'Jos': { image: JosImage, team: 'product' },
  'Jeeshan': { image: JeeshanImage, team: 'amigo' },
  'Hitesh': { image: HiteshImage, team: 'rocket' },
  'Dries': { image: DriesImage, team: 'management' },
  'Giri': { image: GiriImage, team: 'one' },
  'Louise': { image: LouiseImage, team: 'product' },
  'Nick': { image: NickImage, team: 'amigo' },
  'Ivan': { image: IvanImage, team: 'rocket' },
  'Karl': { image: KarlImage, team: 'management' },
  'Jesse': { image: JesseImage, team: 'one' },
  'Luc': { image: LucImage, team: 'product' },
  'Tarek': { image: TarekImage, team: 'amigo' },
  'Kevin': { image: KevinImage, team: 'rocket' },
  'Michiel': { image: MichielImage, team: 'management' },
  'Maria': { image: MariaImage, team: 'one' },
  'Mike': { image: MikeImage, team: 'product' },
  'Tonny': { image: TonnyImage, team: 'amigo' },
  'Linh': { image: LinhImage, team: 'rocket' },
  'Ralph': { image: RalphImage, team: 'one' },
  'Tissam': { image: TissamImage, team: 'product' },
  'Liz': { image: LizImage, team: 'rocket' },
  'Sid': { image: SidImage, team: 'one' },
  'Wala': { image: WalaImage, team: 'one' },
  'Kenny': { image: KennyImage, team: 'rocket' }
};

// Helper function to get character images in a format compatible with the main page
export const getCharacterImagesArray = () => {
  return Object.entries(characterData).map(([name, data]) => ({
    src: data.image,
    alt: name,
    team: data.team
  }));
};
