'use client'
import { Buffer } from 'buffer';

// @ts-ignore
window.Buffer = Buffer;
import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowRightIcon, CheckCircleIcon, KeyIcon, HashIcon, PenIcon, SendIcon, ShieldCheckIcon } from "lucide-react"
import * as ed from "@noble/ed25519"
import * as secp from "@noble/secp256k1"

type KeyPair = {
  publicKey: string;
  privateKey: string;
}

type Transaction = {
  recipient: string;
  amount: number;
  blockchainParam: string;
}

type BlockchainType = 'solana' | 'ethereum'

export default function BlockchainTransactionDemo() {
  const [keys, setKeys] = useState<Record<BlockchainType, KeyPair>>({
    solana: { publicKey: '', privateKey: '' },
    ethereum: { publicKey: '', privateKey: '' }
  })
  const [transaction, setTransaction] = useState<Record<BlockchainType, Transaction>>({
    solana: { recipient: '', amount: 0, blockchainParam: '' },
    ethereum: { recipient: '', amount: 0, blockchainParam: '' }
  })
  const [transactionHash, setTransactionHash] = useState<Record<BlockchainType, string>>({
    solana: '',
    ethereum: ''
  })
  const [signature, setSignature] = useState<Record<BlockchainType, string>>({
    solana: '',
    ethereum: ''
  })
  const [isVerified, setIsVerified] = useState<Record<BlockchainType, boolean>>({
    solana: false,
    ethereum: false
  })
  const [currentStep, setCurrentStep] = useState<Record<BlockchainType, number>>({
    solana: 1,
    ethereum: 1
  })

  const generateKeypair = async (type: BlockchainType) => {
    if (type === 'solana') {
      const privateKey = ed.utils.randomPrivateKey()
      const publicKey = await ed.getPublicKeyAsync(privateKey)
      setKeys(prev => ({
        ...prev,
        solana: {
          privateKey: Buffer.from(privateKey).toString('hex'),
          publicKey: Buffer.from(publicKey).toString('hex')
        }
      }))
    } else {
      const privateKey = secp.utils.randomPrivateKey()
      const publicKey = secp.getPublicKey(privateKey)
      setKeys(prev => ({
        ...prev,
        ethereum: {
          privateKey: Buffer.from(privateKey).toString('hex'),
          publicKey: Buffer.from(publicKey).toString('hex')
        }
      }))
    }
    setCurrentStep(prev => ({ ...prev, [type]: 2 }))
  }

  const createTransaction = (type: BlockchainType) => {
    setTransactionHash(prev => ({
      ...prev,
      [type]: Buffer.from(JSON.stringify(transaction[type])).toString('hex')
    }))
    setCurrentStep(prev => ({ ...prev, [type]: 3 }))
  }

  const signTransaction = async (type: BlockchainType) => {
    const message = new TextEncoder().encode(transactionHash[type])
    if (type === 'solana') {
      const privateKey = Uint8Array.from(Buffer.from(keys.solana.privateKey, 'hex'))
      const signature = await ed.signAsync(message, privateKey)
      setSignature(prev => ({ ...prev, solana: Buffer.from(signature).toString('hex') }))
    } else {
      const privateKey = Uint8Array.from(Buffer.from(keys.ethereum.privateKey, 'hex'))
      const signature = await secp.signAsync(transactionHash[type], privateKey)
      setSignature(prev => ({ ...prev, ethereum: Buffer.from(signature).toString('hex') }))
    }
    setCurrentStep(prev => ({ ...prev, [type]: 4 }))
  }

  const verifyTransaction = async (type: BlockchainType) => {
    const message = new TextEncoder().encode(transactionHash[type])
    if (type === 'solana') {
      const publicKey = Uint8Array.from(Buffer.from(keys.solana.publicKey, 'hex'))
      const signatureBytes = Uint8Array.from(Buffer.from(signature.solana, 'hex'))
      const isValid = await ed.verifyAsync(signatureBytes, message, publicKey)
      setIsVerified(prev => ({ ...prev, solana: isValid }))
    } else {
      const publicKey = Uint8Array.from(Buffer.from(keys.ethereum.publicKey, 'hex'))
      const signatureBytes = Uint8Array.from(Buffer.from(signature.ethereum, 'hex'))
      const isValid = secp.verify(signatureBytes, transactionHash.ethereum, publicKey)
      setIsVerified(prev => ({ ...prev, ethereum: isValid }))
    }
    setCurrentStep(prev => ({ ...prev, [type]: 5 }))
  }

  const renderBlockchainDemo = (type: BlockchainType) => (
    <Card className="mt-4">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className={`rounded-full p-2 ${currentStep[type] >= 1 ? 'bg-green-500' : 'bg-gray-300'}`}>
              <KeyIcon className="h-4 w-4 text-white" />
            </div>
            <ArrowRightIcon className="h-4 w-4" />
            <div className={`rounded-full p-2 ${currentStep[type] >= 2 ? 'bg-green-500' : 'bg-gray-300'}`}>
              <PenIcon className="h-4 w-4 text-white" />
            </div>
            <ArrowRightIcon className="h-4 w-4" />
            <div className={`rounded-full p-2 ${currentStep[type] >= 3 ? 'bg-green-500' : 'bg-gray-300'}`}>
              <HashIcon className="h-4 w-4 text-white" />
            </div>
            <ArrowRightIcon className="h-4 w-4" />
            <div className={`rounded-full p-2 ${currentStep[type] >= 4 ? 'bg-green-500' : 'bg-gray-300'}`}>
              <SendIcon className="h-4 w-4 text-white" />
            </div>
            <ArrowRightIcon className="h-4 w-4" />
            <div className={`rounded-full p-2 ${currentStep[type] >= 5 ? 'bg-green-500' : 'bg-gray-300'}`}>
              <ShieldCheckIcon className="h-4 w-4 text-white" />
            </div>
          </div>

          {currentStep[type] >= 1 && (
            <div>
              <Button onClick={() => generateKeypair(type)} disabled={currentStep[type] > 1}>
                Generate Keypair
              </Button>
              {keys[type].publicKey && (
                <div className="mt-2">
                  <p className="text-sm"><strong>Public Key:</strong> {keys[type].publicKey.slice(0, 20)}...</p>
                  <p className="text-sm"><strong>Private Key:</strong> {keys[type].privateKey.slice(0, 20)}...</p>
                </div>
              )}
            </div>
          )}

          {currentStep[type] >= 2 && (
            <div>
              <Label htmlFor={`recipient-${type}`}>Recipient</Label>
              <Input
                id={`recipient-${type}`}
                value={transaction[type].recipient}
                onChange={(e) => setTransaction(prev => ({
                  ...prev,
                  [type]: { ...prev[type], recipient: e.target.value }
                }))}
                placeholder="Recipient's address"
              />
              <Label htmlFor={`amount-${type}`}>Amount</Label>
              <Input
                id={`amount-${type}`}
                type="number"
                value={transaction[type].amount}
                onChange={(e) => setTransaction(prev => ({
                  ...prev,
                  [type]: { ...prev[type], amount: parseFloat(e.target.value) }
                }))}
                placeholder="Amount"
              />
              <Label htmlFor={`param-${type}`}>{type === 'solana' ? 'Latest Block Hash' : 'Gas Price'}</Label>
              <Input
                id={`param-${type}`}
                value={transaction[type].blockchainParam}
                onChange={(e) => setTransaction(prev => ({
                  ...prev,
                  [type]: { ...prev[type], blockchainParam: e.target.value }
                }))}
                placeholder={type === 'solana' ? 'Latest Block Hash' : 'Gas Price'}
              />
              <Button onClick={() => createTransaction(type)} className="mt-2" disabled={currentStep[type] > 2}>
                Create Transaction
              </Button>
            </div>
          )}

          {currentStep[type] >= 3 && (
            <div>
              <p className="text-sm"><strong>Transaction Hash:</strong> {transactionHash[type].slice(0, 20)}...</p>
              <Button onClick={() => signTransaction(type)} className="mt-2" disabled={currentStep[type] > 3}>
                Sign Transaction
              </Button>
            </div>
          )}

          {currentStep[type] >= 4 && (
            <div>
              <p className="text-sm"><strong>Signature:</strong> {signature[type].slice(0, 20)}...</p>
              <Button onClick={() => verifyTransaction(type)} className="mt-2" disabled={currentStep[type] > 4}>
                Verify Transaction
              </Button>
            </div>
          )}

          {currentStep[type] >= 5 && (
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className={`h-5 w-5 ${isVerified[type] ? 'text-green-500' : 'text-red-500'}`} />
              <p>{isVerified[type] ? 'Transaction Verified!' : 'Transaction Verification Failed'}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Blockchain Transaction Demo</h1>
      <Tabs defaultValue="solana">
        <TabsList>
          <TabsTrigger value="solana">Solana (ED25519)</TabsTrigger>
          <TabsTrigger value="ethereum">Ethereum (secp256k1)</TabsTrigger>
        </TabsList>
        <TabsContent value="solana">
          <Card>
            <CardHeader>
              <CardTitle>Solana Transaction Process</CardTitle>
            </CardHeader>
            <CardContent>
              {renderBlockchainDemo('solana')}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="ethereum">
          <Card>
            <CardHeader>
              <CardTitle>Ethereum Transaction Process</CardTitle>
            </CardHeader>
            <CardContent>
              {renderBlockchainDemo('ethereum')}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}