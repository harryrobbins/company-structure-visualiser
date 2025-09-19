from datetime import date
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

# Define the data structure for a company using Pydantic.
class Company(BaseModel):
    company_name: str = Field(alias='CompanyName')
    company_number: str = Field(alias='CompanyNumber')
    regaddress_careof: Optional[str] = Field(alias='RegAddress.CareOf', default=None)
    regaddress_pobox: Optional[str] = Field(alias='RegAddress.POBox', default=None)
    regaddress_addressline1: Optional[str] = Field(alias='RegAddress.AddressLine1', default=None)
    regaddress_addressline2: Optional[str] = Field(alias='RegAddress.AddressLine2', default=None)
    regaddress_posttown: Optional[str] = Field(alias='RegAddress.PostTown', default=None)
    regaddress_county: Optional[str] = Field(alias='RegAddress.County', default=None)
    regaddress_country: Optional[str] = Field(alias='RegAddress.Country', default=None)
    regaddress_postcode: Optional[str] = Field(alias='RegAddress.PostCode', default=None)
    company_category: Optional[str] = Field(alias='CompanyCategory', default=None)
    company_status: Optional[str] = Field(alias='CompanyStatus', default=None)
    country_of_origin: Optional[str] = Field(alias='CountryOfOrigin', default=None)
    dissolution_date: Optional[date] = Field(alias='DissolutionDate', default=None)
    incorporation_date: Optional[date] = Field(alias='IncorporationDate', default=None)
    accounts_accountrefday: Optional[int] = Field(alias='Accounts.AccountRefDay', default=None)
    accounts_accountrefmonth: Optional[int] = Field(alias='Accounts.AccountRefMonth', default=None)
    accounts_nextduedate: Optional[date] = Field(alias='Accounts.NextDueDate', default=None)
    accounts_lastmadeupdate: Optional[date] = Field(alias='Accounts.LastMadeUpDate', default=None)
    accounts_accountcategory: Optional[str] = Field(alias='Accounts.AccountCategory', default=None)
    returns_nextduedate: Optional[date] = Field(alias='Returns.NextDueDate', default=None)
    returns_lastmadeupdate: Optional[date] = Field(alias='Returns.LastMadeUpDate', default=None)
    mortgages_nummortcharges: Optional[int] = Field(alias='Mortgages.NumMortCharges', default=None)
    mortgages_nummortoutstanding: Optional[int] = Field(alias='Mortgages.NumMortOutstanding', default=None)
    mortgages_nummortpartsatisfied: Optional[int] = Field(alias='Mortgages.NumMortPartSatisfied', default=None)
    mortgages_nummortsatisfied: Optional[int] = Field(alias='Mortgages.NumMortSatisfied', default=None)
    siccode_sictext_1: Optional[str] = Field(alias='SICCode.SicText_1', default=None)
    siccode_sictext_2: Optional[str] = Field(alias='SICCode.SicText_2', default=None)
    siccode_sictext_3: Optional[str] = Field(alias='SICCode.SicText_3', default=None)
    siccode_sictext_4: Optional[str] = Field(alias='SICCode.SicText_4', default=None)
    limitedpartnerships_numgenpartners: Optional[int] = Field(alias='LimitedPartnerships.NumGenPartners', default=None)
    limitedpartnerships_numlimpartners: Optional[int] = Field(alias='LimitedPartnerships.NumLimPartners', default=None)
    uri: Optional[str] = Field(alias='URI', default=None)
    previousname_1_condate: Optional[date] = Field(alias='PreviousName_1.CONDATE', default=None)
    previousname_1_companyname: Optional[str] = Field(alias='PreviousName_1.CompanyName', default=None)
    previousname_2_condate: Optional[date] = Field(alias='PreviousName_2.CONDATE', default=None)
    previousname_2_companyname: Optional[str] = Field(alias='PreviousName_2.CompanyName', default=None)
    previousname_3_condate: Optional[date] = Field(alias='PreviousName_3.CONDATE', default=None)
    previousname_3_companyname: Optional[str] = Field(alias='PreviousName_3.CompanyName', default=None)
    previousname_4_condate: Optional[date] = Field(alias='PreviousName_4.CONDATE', default=None)
    previousname_4_companyname: Optional[str] = Field(alias='PreviousName_4.CompanyName', default=None)
    previousname_5_condate: Optional[date] = Field(alias='PreviousName_5.CONDATE', default=None)
    previousname_5_companyname: Optional[str] = Field(alias='PreviousName_5.CompanyName', default=None)
    previousname_6_condate: Optional[date] = Field(alias='PreviousName_6.CONDATE', default=None)
    previousname_6_companyname: Optional[str] = Field(alias='PreviousName_6.CompanyName', default=None)
    previousname_7_condate: Optional[date] = Field(alias='PreviousName_7.CONDATE', default=None)
    previousname_7_companyname: Optional[str] = Field(alias='PreviousName_7.CompanyName', default=None)
    previousname_8_condate: Optional[date] = Field(alias='PreviousName_8.CONDATE', default=None)
    previousname_8_companyname: Optional[str] = Field(alias='PreviousName_8.CompanyName', default=None)
    previousname_9_condate: Optional[date] = Field(alias='PreviousName_9.CONDATE', default=None)
    previousname_9_companyname: Optional[str] = Field(alias='PreviousName_9.CompanyName', default=None)
    previousname_10_condate: Optional[date] = Field(alias='PreviousName_10.CONDATE', default=None)
    previousname_10_companyname: Optional[str] = Field(alias='PreviousName_10.CompanyName', default=None)
    confstmtnextduedate: Optional[date] = Field(alias='ConfStmtNextDueDate', default=None)
    confstmtlastmadeupdate: Optional[date] = Field(alias='ConfStmtLastMadeUpDate', default=None)

    model_config = ConfigDict(
        populate_by_name=True,
        extra='allow',
        json_schema_serialization_by_alias=False
    )

# Mapping from Pydantic type to DuckDB type
PYDANTIC_TO_DUCKDB = {
    str: 'VARCHAR',
    int: 'INTEGER',
    date: 'DATE',
    float: 'DOUBLE',
    bool: 'BOOLEAN'
}
