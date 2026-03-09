
import { 
  faDatabase, 
  faRocket, 
  faBuilding, 
  faUsers, 
  faHeartbeat, 
  faStethoscope, 
  faNotesMedical,
  faMoneyBillWave, 
  faCoins, 
  faHandHoldingUsd,
  faGraduationCap, 
  faSchool, 
  faBook,
  faUtensils, 
  faSeedling, 
  faLeaf,
  faHome, 
  faHouseUser,
  faFirstAid, 
  faLifeRing,
  faBriefcase, 
  faTools,
  faBlind, 
  faUserClock,
  faChild,
  faVenus,
  faBus, 
  faCar,
  faHandsHelping,
  faWheelchair,
  faUserGraduate,
  faPrayingHands,
  faHandHoldingHeart
} from '@fortawesome/free-solid-svg-icons';
import { Citizen } from 'types/citizen';
import { ProgramDefinition } from 'types/program';

export const getProgramIcon = (name: string, description: string = '') => {
  const text = `${name} ${description}`.toLowerCase();
  
  // Medical / Health
  if (text.match(/health|medical|hospital|clinic|medicine|doctor|nurse|checkup|vaccin/)) {
    if (text.includes('checkup') || text.includes('consult')) return faStethoscope;
    if (text.includes('record') || text.includes('history')) return faNotesMedical;
    return faHeartbeat;
  }

  // Financial / Pension / Cash
  if (text.match(/money|cash|fund|finance|loan|pension|allowance|subsidy|budget|cost|pay/)) {
    if (text.includes('pension')) return faUserClock;
    if (text.includes('hand') || text.includes('aid') || text.includes('help')) return faHandHoldingUsd;
    if (text.includes('coin') || text.includes('savings')) return faCoins;
    return faMoneyBillWave;
  }

  // Education / Scholarship
  if (text.match(/education|school|student|scholar|learn|study|academic|university|college|training/)) {
    if (text.includes('scholar') || text.includes('graduate')) return faUserGraduate;
    if (text.includes('book') || text.includes('library')) return faBook;
    return faGraduationCap;
  }

  // Food / Agriculture
  if (text.match(/food|agricultur|farm|crop|seed|plant|rice|feeding|nutrition|eat|meal/)) {
    if (text.includes('farm') || text.includes('plant')) return faSeedling;
    if (text.includes('leaf') || text.includes('green')) return faLeaf;
    return faUtensils;
  }

  // Housing / Shelter
  if (text.match(/hous|shelter|home|building|residen|construct|infra/)) {
    if (text.includes('user') || text.includes('family')) return faHouseUser;
    return faHome;
  }

  // Emergency / Disaster
  if (text.match(/disaster|emergency|crisis|calamity|rescue|relief|typhoon|fire|flood/)) {
    if (text.includes('relief') || text.includes('help')) return faHandsHelping;
    return faLifeRing;
  }

  // Employment / Livelihood
  if (text.match(/employ|job|work|labor|career|business|livelihood|skill|trade/)) {
    if (text.includes('tool') || text.includes('skill')) return faTools;
    return faBriefcase;
  }

  // Specific Demographics
  if (text.match(/senior|elder|old|aged|retire/)) return faBlind;
  if (text.match(/child|kid|youth|minor|infant|baby/)) return faChild;
  if (text.match(/woman|women|female|gender|mother|maternal/)) return faVenus;
  if (text.match(/disab|pwd|handicap|impaired/)) return faWheelchair;
  if (text.match(/indigent|poor|poverty|marginal/)) return faHandHoldingHeart;

  // Transport
  if (text.match(/transport|vehicle|bus|car|driver|trip|travel/)) {
    if (text.includes('bus')) return faBus;
    return faCar;
  }

  // Default
  return faDatabase;
};

export const getProgramColor = (name: string, description: string = '') => {
  const text = `${name} ${description}`.toLowerCase();
  
  if (text.match(/health|medical|hospital/)) return 'success'; // Green
  if (text.match(/money|cash|finance|pension/)) return 'warning'; // Yellow/Gold
  if (text.match(/education|scholar|school/)) return 'info'; // Blue/Cyan
  if (text.match(/food|agricultur|farm/)) return 'success'; // Green
  if (text.match(/hous|shelter|home/)) return 'primary'; // Blue
  if (text.match(/disaster|emergency|crisis|fire/)) return 'danger'; // Red
  if (text.match(/employ|job|work/)) return 'primary'; // Blue
  if (text.match(/senior|elder|pwd/)) return 'secondary'; // Grey
  
  return 'primary'; // Default Blue
};

export const checkEligibility = (citizen: Citizen, program: ProgramDefinition): { eligible: boolean; reasons: string[] } => {
  const reasons: string[] = [];
  const criteria = program.eligibility_criteria;

  if (!criteria) return { eligible: true, reasons: [] };

  // Age Check
  if (criteria.minAge !== null && criteria.minAge !== undefined && criteria.minAge > 0) {
    if (citizen.age < criteria.minAge) {
      reasons.push(`Minimum age required is ${criteria.minAge}. Citizen is ${citizen.age}.`);
    }
  }

  if (criteria.maxAge !== null && criteria.maxAge !== undefined && criteria.maxAge > 0) {
    if (citizen.age > criteria.maxAge) {
      reasons.push(`Maximum age allowed is ${criteria.maxAge}. Citizen is ${citizen.age}.`);
    }
  }

  // Sex Check
  if (criteria.sex) {
    if (citizen.sex !== criteria.sex) {
      reasons.push(`Program is restricted to ${criteria.sex} citizens only.`);
    }
  }

  // Barangay Check
  if (criteria.barangay && criteria.barangay.length > 0) {
    if (!criteria.barangay.includes(citizen.barangay)) {
      reasons.push(`Residency restricted to: ${criteria.barangay.join(', ')}. Citizen is from ${citizen.barangay}.`);
    }
  }

  return {
    eligible: reasons.length === 0,
    reasons
  };
};
