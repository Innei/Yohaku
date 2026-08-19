import { useLocalSearchParams } from 'expo-router'

import { SearchScreen } from '@/screens/search/search-screen'

export default function SearchRoute() {
  const { scope } = useLocalSearchParams<{ scope?: string | string[] }>()
  return <SearchScreen scope={scope} />
}
