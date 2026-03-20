import pytest
from django.core.exceptions import ValidationError
from django.utils import timezone

from api.models import (
    Branch, Profile, Customer, Vehicle, JobCard, Part, Supplier,
    UserRole, WorkflowStage, WORKFLOW_TRANSITIONS,
    CustomerCategory, TaskStatus,
)
from tests.conftest import (
    BranchFactory, UserFactory, ProfileFactory, CustomerFactory,
    VehicleFactory, JobCardFactory, PartFactory, SupplierFactory,
)


@pytest.mark.unit
@pytest.mark.django_db
class TestBranchModel:
    def test_create_branch(self):
        branch = BranchFactory(code="HQ-001", name="Headquarters")
        assert branch.pk is not None
        assert branch.code == "HQ-001"
        assert branch.is_active is True

    def test_branch_str(self):
        branch = BranchFactory(code="HQ-001", name="Headquarters")
        assert str(branch) == "HQ-001 - Headquarters"

    def test_branch_with_parent(self):
        parent = BranchFactory(code="HQ", is_headquarters=True)
        child = BranchFactory(code="SUB-1", parent_branch=parent)
        assert child.parent_branch == parent
        assert parent.sub_branches.count() == 1


@pytest.mark.unit
@pytest.mark.django_db
class TestProfileModel:
    def test_create_profile(self):
        profile = ProfileFactory(role=UserRole.SUPER_ADMIN)
        assert profile.pk is not None
        assert profile.role == UserRole.SUPER_ADMIN

    def test_profile_str(self):
        profile = ProfileFactory()
        assert profile.user.username in str(profile)

    def test_all_roles_valid(self):
        for role_choice in UserRole.choices:
            profile = ProfileFactory(role=role_choice[0])
            assert profile.role == role_choice[0]


@pytest.mark.unit
@pytest.mark.django_db
class TestCustomerModel:
    def test_auto_generate_customer_id(self):
        customer = CustomerFactory()
        assert customer.customer_id.startswith("CUST-")
        assert len(customer.customer_id) == 13

    def test_customer_id_unique(self):
        c1 = CustomerFactory()
        c2 = CustomerFactory()
        assert c1.customer_id != c2.customer_id

    def test_customer_defaults(self):
        customer = CustomerFactory()
        assert customer.is_active is True
        assert customer.loyalty_points == 0
        assert customer.credit_limit == 0
        assert customer.outstanding_balance == 0

    def test_customer_str(self):
        customer = CustomerFactory(name="John Doe")
        assert "John Doe" in str(customer)

    def test_customer_category_choices(self):
        for cat in CustomerCategory.choices:
            c = CustomerFactory(customer_category=cat[0])
            assert c.customer_category == cat[0]


@pytest.mark.unit
@pytest.mark.django_db
class TestVehicleModel:
    def test_create_vehicle(self):
        vehicle = VehicleFactory()
        assert vehicle.pk is not None
        assert vehicle.customer is not None

    def test_vehicle_customer_relationship(self):
        customer = CustomerFactory()
        v1 = VehicleFactory(customer=customer)
        v2 = VehicleFactory(customer=customer)
        assert customer.vehicles.count() == 2


@pytest.mark.unit
@pytest.mark.django_db
class TestJobCardModel:
    def test_create_job_card(self):
        jc = JobCardFactory()
        assert jc.pk is not None
        assert jc.workflow_stage == WorkflowStage.APPOINTMENT

    def test_job_card_auto_number(self):
        jc = JobCardFactory()
        assert jc.job_card_number is not None
        assert jc.job_card_number != ""

    def test_job_card_is_not_deleted_by_default(self):
        jc = JobCardFactory()
        assert jc.is_deleted is False


@pytest.mark.unit
@pytest.mark.django_db
class TestWorkflowTransitions:
    def test_all_stages_have_entries(self):
        for stage in WorkflowStage.choices:
            assert stage[0] in WORKFLOW_TRANSITIONS

    def test_appointment_to_checkin(self):
        assert WorkflowStage.CHECK_IN in WORKFLOW_TRANSITIONS[WorkflowStage.APPOINTMENT]

    def test_completed_has_no_transitions(self):
        assert WORKFLOW_TRANSITIONS[WorkflowStage.COMPLETED] == []

    def test_qc_can_go_back_to_execution(self):
        assert WorkflowStage.EXECUTION in WORKFLOW_TRANSITIONS[WorkflowStage.QC]

    def test_approval_can_go_back_to_estimate(self):
        assert WorkflowStage.ESTIMATE in WORKFLOW_TRANSITIONS[WorkflowStage.APPROVAL]

    def test_no_backward_transitions_except_defined(self):
        forward_only = [
            WorkflowStage.APPOINTMENT,
            WorkflowStage.CHECK_IN,
            WorkflowStage.INSPECTION,
            WorkflowStage.JOB_CARD,
            WorkflowStage.ESTIMATE,
            WorkflowStage.EXECUTION,
            WorkflowStage.BILLING,
            WorkflowStage.DELIVERY,
        ]
        for stage in forward_only:
            targets = WORKFLOW_TRANSITIONS[stage]
            assert len(targets) == 1


@pytest.mark.unit
@pytest.mark.django_db
class TestPartModel:
    def test_create_part(self):
        part = PartFactory()
        assert part.pk is not None
        assert part.stock == 100

    def test_part_sku_unique(self):
        p1 = PartFactory()
        p2 = PartFactory()
        assert p1.sku != p2.sku


@pytest.mark.unit
@pytest.mark.django_db
class TestSupplierModel:
    def test_auto_generate_supplier_id(self):
        supplier = SupplierFactory()
        assert supplier.supplier_id.startswith("SUP-")

    def test_supplier_defaults(self):
        supplier = SupplierFactory()
        assert supplier.is_active is True
        assert supplier.credit_limit == 0
        assert supplier.outstanding_balance == 0
