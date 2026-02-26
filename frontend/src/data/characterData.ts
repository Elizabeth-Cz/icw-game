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

// Map of character names to their PNG images and teams
export const characterData: Record<string, CharacterImageData> = {
  'Alex': { image: AlexImage, team: 'rocket' },
  'Anna': { image: AnnaImage, team: 'management' },
  'Brian': { image: BrianImage, team: 'management' },
  'David': { image: DavidImage, team: 'amigo' },
  'Diogo': { image: DiogoImage, team: 'rocket' },
  'Dries': { image: DriesImage, team: 'management' },
  'Elouan': { image: ElouanImage, team: 'one' },
  'Frank': { image: FrankImage, team: 'one' },
  'Giri': { image: GiriImage, team: 'one' },
  'Hitesh': { image: HiteshImage, team: 'rocket' },
  'Ivan': { image: IvanImage, team: 'rocket' },
  'Ivana': { image: IvanaImage, team: 'product' },
  'Jeeshan': { image: JeeshanImage, team: 'amigo' },
  'Jesse': { image: JesseImage, team: 'one' },
  'Jos': { image: JosImage, team: 'product' },
  'Karl': { image: KarlImage, team: 'management' },
  'Kevin': { image: KevinImage, team: 'rocket' },
  'Linh': { image: LinhImage, team: 'rocket' },
  'Liz': { image: LizImage, team: 'rocket' },
  'Louise': { image: LouiseImage, team: 'product' },
  'Luc': { image: LucImage, team: 'product' },
  'Maria': { image: MariaImage, team: 'one' },
  'Michiel': { image: MichielImage, team: 'management' },
  'Mike': { image: MikeImage, team: 'product' },
  'Nick': { image: NickImage, team: 'amigo' },
  'Ralph': { image: RalphImage, team: 'one' },
  'Sid': { image: SidImage, team: 'one' },
  'Tarek': { image: TarekImage, team: 'amigo' },
  'Tissam': { image: TissamImage, team: 'product' },
  'Tonny': { image: TonnyImage, team: 'amigo' },
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
