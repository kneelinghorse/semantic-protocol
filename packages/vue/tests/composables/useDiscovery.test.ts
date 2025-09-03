import { describe, it, expect, beforeEach } from 'vitest'
import { ref } from 'vue'
import { useDiscovery, useReactiveDiscovery } from '../../src/composables/useDiscovery'

describe('useDiscovery', () => {
  let sampleData: Record<string, any>

  beforeEach(() => {
    sampleData = {
      id: 'USR_001',
      email: 'test@example.com',
      created_at: '2024-01-01T00:00:00Z',
      monthly_price: 29.99,
      is_premium: true,
      status: 'active',
      discount_rate: 0.15,
      website_url: 'https://example.com',
      user_id: 123,
      description: null
    }
  })

  describe('useDiscovery composable', () => {
    it('should initialize with empty state', () => {
      const { fields, relationships, isDiscovering } = useDiscovery()

      expect(fields.value).toEqual([])
      expect(relationships.value).toEqual([])
      expect(isDiscovering.value).toBe(false)
    })

    it('should discover fields from data object', () => {
      const { discover } = useDiscovery()

      const fields = discover(sampleData)

      expect(fields).toHaveLength(Object.keys(sampleData).length)
      expect(fields.find(f => f.name === 'email')).toBeDefined()
      expect(fields.find(f => f.name === 'created_at')).toBeDefined()
      expect(fields.find(f => f.name === 'monthly_price')).toBeDefined()
    })

    it('should infer correct data types', () => {
      const { discover } = useDiscovery()

      const fields = discover(sampleData)

      const emailField = fields.find(f => f.name === 'email')
      expect(emailField?.type).toBe('string')

      const priceField = fields.find(f => f.name === 'monthly_price')
      expect(priceField?.type).toBe('float')

      const premiumField = fields.find(f => f.name === 'is_premium')
      expect(premiumField?.type).toBe('boolean')

      const createdField = fields.find(f => f.name === 'created_at')
      expect(createdField?.type).toBe('datetime')

      const idField = fields.find(f => f.name === 'user_id')
      expect(idField?.type).toBe('integer')
    })

    it('should detect nullable fields', () => {
      const { discover } = useDiscovery()

      const fields = discover(sampleData)

      const descriptionField = fields.find(f => f.name === 'description')
      expect(descriptionField?.nullable).toBe(true)

      const emailField = fields.find(f => f.name === 'email')
      expect(emailField?.nullable).toBe(false)
    })

    it('should detect primary keys', () => {
      const { discover } = useDiscovery()

      const fields = discover({ id: 'USR_001', name: 'John' })

      const idField = fields.find(f => f.name === 'id')
      expect(idField?.primaryKey).toBe(true)
    })

    it('should detect foreign keys and relationships', () => {
      const { discover, relationships } = useDiscovery()

      const dataWithForeignKey = {
        id: 'USR_001',
        company_id: 'COMP_123',
        name: 'John'
      }

      discover(dataWithForeignKey)

      const companyIdField = discover(dataWithForeignKey).find(f => f.name === 'company_id')
      expect(companyIdField?.foreignKey).toBe(true)

      expect(relationships.value).toHaveLength(1)
      expect(relationships.value[0].type).toBe('association')
      expect(relationships.value[0].from).toBe('company_id')
      expect(relationships.value[0].to).toBe('company')
    })

    it('should discover from array of objects', () => {
      const { discoverFromArray } = useDiscovery()

      const dataArray = [
        { id: 1, name: 'John', email: 'john@example.com', age: null },
        { id: 2, name: 'Jane', email: 'jane@example.com', age: 25 },
        { id: 3, name: 'Bob', email: null, age: 30 }
      ]

      const fields = discoverFromArray(dataArray)

      expect(fields).toHaveLength(4)

      const emailField = fields.find(f => f.name === 'email')
      expect(emailField?.nullable).toBe(true) // Because one entry is null

      const ageField = fields.find(f => f.name === 'age')
      expect(ageField?.nullable).toBe(true) // Because first entry is null
    })

    it('should handle type conflicts in arrays', () => {
      const { discoverFromArray } = useDiscovery()

      const dataArray = [
        { value: 123 },      // integer
        { value: 45.67 },    // float  
        { value: 'text' }    // string
      ]

      const fields = discoverFromArray(dataArray)

      const valueField = fields.find(f => f.name === 'value')
      expect(valueField?.type).toBe('string') // Falls back to string for mixed types
    })

    it('should handle numeric type consistency', () => {
      const { discoverFromArray } = useDiscovery()

      const dataArray = [
        { price: 29 },      // integer
        { price: 45.67 }    // float
      ]

      const fields = discoverFromArray(dataArray)

      const priceField = fields.find(f => f.name === 'price')
      expect(priceField?.type).toBe('number') // Unified numeric type
    })

    it('should update unique flags correctly', () => {
      const { discoverFromArray } = useDiscovery()

      const dataArray = [
        { id: 1, status: 'active' },
        { id: 2, status: 'active' },    // status is not unique
        { id: 3, status: 'inactive' }
      ]

      const fields = discoverFromArray(dataArray)

      const idField = fields.find(f => f.name === 'id')
      expect(idField?.unique).toBe(true) // IDs are unique

      const statusField = fields.find(f => f.name === 'status')
      expect(statusField?.unique).toBe(false) // Status repeats
    })
  })

  describe('useReactiveDiscovery composable', () => {
    it('should reactively discover fields when data changes', async () => {
      const dataRef = ref(sampleData)
      
      const { fields } = useReactiveDiscovery(dataRef, { immediate: false })

      expect(fields.value).toEqual([])

      // Trigger discovery
      dataRef.value = { ...sampleData, new_field: 'test' }

      await new Promise(resolve => setTimeout(resolve, 0))

      expect(fields.value.length).toBeGreaterThan(0)
      expect(fields.value.find(f => f.name === 'new_field')).toBeDefined()
    })

    it('should handle array data reactively', async () => {
      const dataRef = ref([sampleData])
      
      const { fields } = useReactiveDiscovery(dataRef)

      expect(fields.value.length).toBeGreaterThan(0)

      // Add more data
      dataRef.value = [
        sampleData,
        { ...sampleData, id: 'USR_002', extra_field: 'value' }
      ]

      await new Promise(resolve => setTimeout(resolve, 0))

      expect(fields.value.find(f => f.name === 'extra_field')).toBeDefined()
    })

    it('should provide computed helpers', () => {
      const dataRef = ref(sampleData)
      
      const { 
        fieldsByType, 
        uniqueFields, 
        nullableFields, 
        primaryKeys, 
        foreignKeys 
      } = useReactiveDiscovery(dataRef)

      expect(fieldsByType.value).toBeDefined()
      expect(fieldsByType.value.string).toBeDefined()
      expect(fieldsByType.value.boolean).toBeDefined()

      expect(uniqueFields.value).toBeDefined()
      expect(nullableFields.value).toBeDefined()
      expect(primaryKeys.value).toBeDefined()
      expect(foreignKeys.value).toBeDefined()

      // Check specific computed values
      expect(primaryKeys.value.length).toBeGreaterThanOrEqual(0)
      expect(nullableFields.value.find(f => f.name === 'description')).toBeDefined()
    })

    it('should debounce discovery when enabled', async () => {
      const dataRef = ref(sampleData)
      
      const { fields } = useReactiveDiscovery(dataRef, {
        debounce: 50,
        immediate: false
      })

      // Rapid changes
      dataRef.value = { ...sampleData, field1: 'test1' }
      dataRef.value = { ...sampleData, field2: 'test2' }
      dataRef.value = { ...sampleData, field3: 'test3' }

      // Should not have discovered yet
      expect(fields.value).toEqual([])

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(fields.value.length).toBeGreaterThan(0)
      expect(fields.value.find(f => f.name === 'field3')).toBeDefined()
    })
  })

  describe('data type inference', () => {
    it('should correctly identify email patterns', () => {
      const { discover } = useDiscovery()

      const fields = discover({
        contact: 'user@domain.com'
      })

      expect(fields[0].type).toBe('string')
      expect(fields[0].value).toBe('user@domain.com')
    })

    it('should correctly identify URL patterns', () => {
      const { discover } = useDiscovery()

      const fields = discover({
        site: 'https://example.com'
      })

      expect(fields[0].type).toBe('string')
    })

    it('should correctly identify date patterns', () => {
      const { discover } = useDiscovery()

      const fields = discover({
        birthday: '1990-05-15',
        created: '2024-01-01T10:30:00Z',
        timestamp: '1704067800'  // Unix timestamp
      })

      const birthdayField = fields.find(f => f.name === 'birthday')
      expect(birthdayField?.type).toBe('date')

      const createdField = fields.find(f => f.name === 'created')
      expect(createdField?.type).toBe('datetime')

      const timestampField = fields.find(f => f.name === 'timestamp')
      expect(timestampField?.type).toBe('timestamp')
    })

    it('should handle Date objects', () => {
      const { discover } = useDiscovery()

      const fields = discover({
        now: new Date()
      })

      expect(fields[0].type).toBe('datetime')
    })

    it('should handle arrays and objects', () => {
      const { discover } = useDiscovery()

      const fields = discover({
        tags: ['vue', 'typescript'],
        metadata: { version: 1, active: true }
      })

      const tagsField = fields.find(f => f.name === 'tags')
      expect(tagsField?.type).toBe('array')

      const metadataField = fields.find(f => f.name === 'metadata')
      expect(metadataField?.type).toBe('object')
    })
  })
})