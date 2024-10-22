import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, PDFDownloadLink } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { 
    padding: 30, 
    backgroundColor: '#ffffff' 
  },
  section: { 
    margin: 10, 
    padding: 10 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 20 
  },
  logo: { 
    width: 100, 
    height: 100 
  },
  businessInfo: { 
    fontSize: 10, 
    alignItems: 'flex-end' 
  },
  title: { 
    fontSize: 24, 
    marginBottom: 20, 
    color: '#333333', 
    fontWeight: 'bold' 
  },
  subheader: { 
    fontSize: 18, 
    marginBottom: 10, 
    color: '#333333', 
    fontWeight: 'bold' 
  },
  text: { 
    fontSize: 12, 
    marginBottom: 5, 
    color: '#333333' 
  },
  bold: { 
    fontWeight: 'bold' 
  },
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 5 
  },
  table: { 
    display: 'table', 
    width: 'auto', 
    marginTop: 10 
  },
  tableRow: { 
    flexDirection: 'row' 
  },
  tableCol: { 
    width: '33.33%', 
    borderStyle: 'solid', 
    borderWidth: 1, 
    borderColor: '#bfbfbf' 
  },
  tableCell: { 
    margin: 'auto', 
    marginTop: 5, 
    marginBottom: 5, 
    fontSize: 10 
  },
});

const QuotePDF = ({ quote, customerInfo, type, businessInfo }) => {
  const renderCustomerInfo = () => {
    return Object.entries(customerInfo).map(([key, value]) => {
      if (key === 'address') {
        return Object.entries(value).map(([addressKey, addressValue]) => (
          <Text key={addressKey} style={styles.text}>
            <Text style={styles.bold}>{addressKey.charAt(0).toUpperCase() + addressKey.slice(1)}:</Text> {addressValue}
          </Text>
        ));
      }
      if (key !== '_id') {
        return (
          <Text key={key} style={styles.text}>
            <Text style={styles.bold}>{key.charAt(0).toUpperCase() + key.slice(1)}:</Text> {value}
          </Text>
        );
      }
      return null;
    });
  };

  const renderPricingTable = () => {
    if (quote.lineItems && quote.lineItems.length > 0) {
      return (
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={styles.tableCol}><Text style={styles.tableCell}>Service</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>Description</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>Price</Text></View>
          </View>
          {quote.lineItems.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={styles.tableCol}><Text style={styles.tableCell}>{item.service}</Text></View>
              <View style={styles.tableCol}><Text style={styles.tableCell}>{item.description}</Text></View>
              <View style={styles.tableCol}><Text style={styles.tableCell}>${item.price.toFixed(2)}</Text></View>
            </View>
          ))}
        </View>
      );
    } else {
      // Fallback to display basic pricing information
      return (
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={styles.tableCol}><Text style={styles.tableCell}>Service</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>Price</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableCol}><Text style={styles.tableCell}>{type.replace('_', ' ')}</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>${quote.totalPrice}</Text></View>
          </View>
        </View>
      );
    }
  };

  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + 30);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {businessInfo.logo && <Image style={styles.logo} src={businessInfo.logo} />}
          <View style={styles.businessInfo}>
            <Text>{businessInfo.name || 'Company Name'}</Text>
            <Text>{businessInfo.address || 'Company Address'}</Text>
            <Text>{businessInfo.phone || 'Company Phone'}</Text>
            <Text>{businessInfo.email || 'Company Email'}</Text>
            <Text>{businessInfo.website || 'Company Website'}</Text>
          </View>
        </View>
        <Text style={styles.title}>Quote #{quote._id}</Text>
        <View style={styles.section}>
          <Text style={styles.subheader}>Customer Information</Text>
          {renderCustomerInfo()}
        </View>
        <View style={styles.section}>
          <Text style={styles.subheader}>Service Details</Text>
          <Text style={styles.text}>
            <Text style={styles.bold}>Service Type:</Text> {type.replace('_', ' ')}
          </Text>
          <Text style={styles.text}>
            <Text style={styles.bold}>Area:</Text> {quote.area} sq ft
          </Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.subheader}>Pricing</Text>
          {renderPricingTable()}
          <View style={[styles.row, { marginTop: 10 }]}>
            <Text style={styles.bold}>Total Price:</Text>
            <Text style={styles.bold}>${quote.totalPrice}</Text>
          </View>
        </View>
        <Text style={[styles.text, { marginTop: 20 }]}>
          This quote is valid until {validUntil.toLocaleDateString()}.
        </Text>
      </Page>
    </Document>
  );
};

export const QuoteDownloadLink = ({ quote, customerInfo, type, businessInfo }) => {
  if (!quote || !customerInfo || !type || !businessInfo) {
    console.error('Missing required props for QuoteDownloadLink');
    return null;
  }

  return (
    <PDFDownloadLink
      document={<QuotePDF quote={quote} customerInfo={customerInfo} type={type} businessInfo={businessInfo} />}
      fileName="quote.pdf"
      className="bg-indigo-600 text-white px-4 py-2 rounded mt-4 inline-block hover:bg-indigo-500"
    >
      {({ blob, url, loading, error }) => {
        if (loading) return 'Generating document...';
        if (error) {
          console.error('Error generating PDF:', error);
          return 'Error generating PDF';
        }
        return 'Download PDF';
      }}
    </PDFDownloadLink>
  );
};

export default QuotePDF;