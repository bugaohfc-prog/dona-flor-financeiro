import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vyhjjtzdvofoqoericak.supabase.co'
const supabaseKey = 'sb_publishable_lC1mtt21iCdk-e6Kdf-3nw_5pdCPIcw'

export const supabase = createClient(supabaseUrl, supabaseKey)
