import type { Entity } from '../../content/types'
import ActivitySection from './ActivitySection'
import CharacterSection from './CharacterSection'
import CollectibleSection from './CollectibleSection'
import CollectionSection from './CollectionSection'
import EnemySection from './EnemySection'
import FactionSection from './FactionSection'
import GuideSection from './GuideSection'
import ItemSection from './ItemSection'
import MountSection from './MountSection'
import PlaceSection from './PlaceSection'
import QuestSection from './QuestSection'
import RecipeSection from './RecipeSection'
import RegionSection from './RegionSection'
import SkillSection from './SkillSection'
import StorylineSection from './StorylineSection'
import VendorSection from './VendorSection'

export default function EntityBody({ record }: { record: Entity }) {
  switch (record.type) {
    case 'region':
      return <RegionSection record={record} />
    case 'place':
      return <PlaceSection record={record} />
    case 'character':
      return <CharacterSection record={record} />
    case 'faction':
      return <FactionSection record={record} />
    case 'storyline':
      return <StorylineSection record={record} />
    case 'quest':
      return <QuestSection record={record} />
    case 'item':
      return <ItemSection record={record} />
    case 'collectible':
      return <CollectibleSection record={record} />
    case 'collection':
      return <CollectionSection record={record} />
    case 'vendor':
      return <VendorSection record={record} />
    case 'recipe':
      return <RecipeSection record={record} />
    case 'skill':
      return <SkillSection record={record} />
    case 'enemy':
      return <EnemySection record={record} />
    case 'mount':
      return <MountSection record={record} />
    case 'activity':
      return <ActivitySection record={record} />
    case 'guide':
      return <GuideSection record={record} />
  }
}
