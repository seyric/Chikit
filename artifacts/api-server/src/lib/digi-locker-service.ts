import { db } from "@workspace/db";
import { sql, eq, and, gt, desc } from "drizzle-orm";
import { digiLockerConnectionsTable } from "@workspace/db/schema";
import { patientsTable } from "@workspace/db/schema";

/**
 * DigiLocker Service for handling DigiLocker document connection and retrieval
 * This service handles the OAuth2 flow with DigiLocker and document fetching
 */
export class DigiLockerService {
  /**
   * Generate the DigiLocker authorization URL for user consent
   * In a real implementation, this would use the DigiLocker developer credentials
   * For now, we simulate the process
   */
  async initiateConnection(options: {
    patientId: number;
    redirectUri: string; // Where DigiLocker should redirect after consent
    scope?: string; // Comma-separated list of document types to request
    state?: string; // CSRF protection token
  }): Promise<{
    authUrl: string;
    state: string;
  }> {
    // Validate patient exists
    const [patient] = await db
      .select()
      .from(patientsTable)
      .where(eq(patientsTable.id, options.patientId));

    if (!patient) {
      throw new Error("Patient not found");
    }

    // In a real implementation, we would:
    // 1. Use DigiLocker client ID and redirect URI to generate auth URL
    // 2. Store the state and code verifier for PKCE
    // 3. Return the auth URL for the user to redirect to

    // For now, we simulate
    const state = options.state || `DIGILOCKER_STATE_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Simulate auth URL (in reality, this would be something like:
    // https://accounts.digilocker.gov.in/oauth/authorize?response_type=code&client_id={clientId}&redirect_uri={redirectUri}&scope={scope}&state={state}
    const authUrl = `https://accounts.digilocker.gov.in/oauth/authorize?response_type=code&client_id=DIGILOCKER_DEMO_CLIENT_ID&redirect_uri=${encodeURIComponent(
      options.redirectUri
    )}&scope=${encodeURIComponent(options.scope || "all")}&state=${state}`;

    return {
      authUrl,
      state,
    };
  }

  /**
   * Handle the callback from DigiLocker after user consent
   * Exchange the authorization code for access and refresh tokens
   */
  async handleCallback(options: {
    patientId: number;
    code: string; // Authorization code from DigiLocker
    state: string; // State parameter for CSRF verification
    codeVerifier?: string; // PKCE code verifier if used
    scope?: string; // Scope that was requested (for storing in connection)
  }): Promise<{
    success: boolean;
    connectionId: string;
    // In a real implementation, we would return token information (encrypted)
  }> {
    // Validate patient exists
    const [patient] = await db
      .select()
      .from(patientsTable)
      .where(eq(patientsTable.id, options.patientId));

    if (!patient) {
      throw new Error("Patient not found");
    }

    // In a real implementation, we would:
    // 1. Verify the state matches what we stored (to prevent CSRF)
    // 2. Exchange the authorization code for tokens via DigiLocker token endpoint
    // 3. Store the encrypted tokens in the database
    // 4. Create a connection record

    // For now, we simulate successful token exchange
    const connectionId = `DIGILOCKER_CONN_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Simulate storing connection (in reality, we would encrypt tokens)
    try {
      await db.insert(digiLockerConnectionsTable).values({
        patientId: options.patientId,
        connectionId,
        accessToken: `ENCRYPTED_ACCESS_TOKEN_${Date.now()}`, // Would be encrypted in reality
        refreshToken: `ENCRYPTED_REFRESH_TOKEN_${Date.now()}`, // Would be encrypted in reality
        scope: options.scope ?? "all",
        status: "connected",
        connectedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return {
        success: true,
        connectionId,
      };
    } catch (error: unknown) {
      throw new Error(`Failed to store DigiLocker connection: ${(error as Error).message}`);
    }
  }

  /**
   * Fetch documents from DigiLocker for a connected patient
   * In a real implementation, this would use the access token to call DigiLocker APIs
   */
  async fetchDocuments(options: {
    patientId: number;
    connectionId: string;
    documentTypes?: string[]; // Specific document types to fetch (if omitted, fetch all consented)
  }): Promise<{
    success: boolean;
    documents: Array<{
      type: string;
      name: string;
      content: string; // In reality, this might be a URL or encrypted content
      issuedBy: string;
      issuedDate: string;
    }>;
  }> {
    // Validate connection exists and is active
    const [connection] = await db
      .select()
      .from(digiLockerConnectionsTable)
      .where(
        and(
          eq(digiLockerConnectionsTable.patientId, options.patientId),
          eq(digiLockerConnectionsTable.connectionId, options.connectionId),
          eq(digiLockerConnectionsTable.status, "connected")
        )
      );

    if (!connection) {
      throw new Error("DigiLocker connection not found or not active");
    }

    // In a real implementation, we would:
    // 1. Decrypt the access token
    // 2. Call DigiLocker API to list/ fetch documents
    // 3. Return the documents

    // For now, we simulate returning some mock documents
    const mockDocuments = [
      {
        type: "Vaccination Certificate",
        name: "COVID-19 Vaccination Certificate",
        content: "BASE64_ENCODED_PDF_OR_URL", // In reality, this would be actual content or a secure URL
        issuedBy: "Ministry of Health and Family Welfare",
        issuedDate: "2023-01-15",
      },
      {
        type: "PAN Card",
        name: "Permanent Account Number Card",
        content: "BASE64_ENCODED_PDF_OR_URL",
        issuedBy: "Income Tax Department, Government of India",
        issuedDate: "2020-05-20",
      },
      {
        type: "Driving License",
        name: "Driving License",
        content: "BASE64_ENCODED_PDF_OR_URL",
        issuedBy: "Regional Transport Office",
        issuedDate: "2021-03-10",
      },
    ];

    // Filter by document types if specified
    let documentsToReturn = mockDocuments;
    if (options.documentTypes && options.documentTypes.length > 0) {
      documentsToReturn = mockDocuments.filter((doc) =>
        options.documentTypes!.includes(doc.type)
      );
    }

    return {
      success: true,
      documents: documentsToReturn,
    };
  }

  /**
   * Disconnect DigiLocker for a patient
   * Revokes access and removes the connection record
   */
  async disconnect(options: {
    patientId: number;
    connectionId: string;
  }): Promise<{
    success: boolean;
  }> {
    try {
      // In a real implementation, we would:
      // 1. Optionally revoke the tokens with DigiLocker
      // 2. Delete or deactivate the connection record

      await db
        .update(digiLockerConnectionsTable)
        .set({
          status: "disconnected",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(digiLockerConnectionsTable.patientId, options.patientId),
            eq(digiLockerConnectionsTable.connectionId, options.connectionId)
          )
        );

      return {
        success: true,
      };
    } catch (error: unknown) {
      throw new Error(`Failed to disconnect DigiLocker: ${(error as Error).message}`);
    }
  }

  /**
   * Get DigiLocker connection status for a patient
   */
  async getConnectionStatus(options: {
    patientId: number;
    connectionId?: string; // If omitted, return the most recent connection
  }): Promise<{
    connected: boolean;
    connectionId: string | null;
    status: string | null;
    connectedAt: string | null;
  }> {
    // Build conditions
    const conditions = [eq(digiLockerConnectionsTable.patientId, options.patientId)];
    if (options.connectionId) {
      conditions.push(eq(digiLockerConnectionsTable.connectionId, options.connectionId));
    }

    const [connection] = await db
      .select()
      .from(digiLockerConnectionsTable)
      .where(and(...conditions))
      .orderBy(desc(digiLockerConnectionsTable.createdAt))
      .limit(1);

    if (!connection) {
      return {
        connected: false,
        connectionId: null,
        status: null,
        connectedAt: null,
      };
    }

    return {
      connected: connection.status === "connected",
      connectionId: connection.connectionId,
      status: connection.status,
      connectedAt: connection.connectedAt?.toISOString() ?? null,
    };
  }
}

// Export singleton instance
export const digiLockerService = new DigiLockerService();